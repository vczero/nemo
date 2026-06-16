import json
import logging
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import AsyncGenerator

import deepagents

log = logging.getLogger("datagent")

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI

from datagent.api.model import ResponseRequest, InputData
from config import settings
from datagent.tools.tools import get_supported_chart_types, get_chart_guide, render_chart, parse_file_tool

PROMPTS_DIR = Path(__file__).parent / "prompts"

router = APIRouter()


# ============================================================
# State
# ============================================================

@dataclass
class ToolCallState:
    item_id: str
    call_id: str
    name: str
    args: str = ""
    output_index: int = 0


@dataclass
class StreamState:
    response_id: str = field(default_factory=lambda: f"resp_{uuid.uuid4().hex[:24]}")
    item_id: str = field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:16]}")
    sequence: int = 0
    full_text: str = ""
    final_text: str = ""
    tool_calls: dict[int, ToolCallState] = field(default_factory=dict)
    next_tool_output_index: int = 1
    usage_input_tokens: int = 0
    usage_output_tokens: int = 0
    usage_total_tokens: int = 0

    def seq(self) -> int:
        self.sequence += 1
        return self.sequence

    def new_tool_call(self, idx: int, call_id: str, name: str) -> ToolCallState:
        tc = ToolCallState(
            item_id=f"fc_{uuid.uuid4().hex[:16]}",
            call_id=call_id,
            name=name,
            output_index=self.next_tool_output_index,
        )
        self.tool_calls[idx] = tc
        self.next_tool_output_index += 1
        return tc


# ============================================================
# Event Builder
# ============================================================

class EventBuilder:
    OUTPUT_INDEX = 0
    CONTENT_INDEX = 0

    @classmethod
    def created(cls, s: StreamState) -> dict:
        return {"type": "response.created", "sequence_number": s.seq(),
                "response": {"id": s.response_id, "status": "in_progress", "output": []}}

    @classmethod
    def in_progress(cls, s: StreamState) -> dict:
        return {"type": "response.in_progress", "sequence_number": s.seq(),
                "response": {"id": s.response_id, "status": "in_progress"}}

    @classmethod
    def output_item_added(cls, s: StreamState) -> dict:
        return {"type": "response.output_item.added", "sequence_number": s.seq(),
                "output_index": cls.OUTPUT_INDEX,
                "item": {"id": s.item_id, "type": "message", "status": "in_progress",
                         "role": "assistant", "content": []}}

    @classmethod
    def content_part_added(cls, s: StreamState) -> dict:
        return {"type": "response.content_part.added", "sequence_number": s.seq(),
                "item_id": s.item_id,
                "output_index": cls.OUTPUT_INDEX,
                "content_index": cls.CONTENT_INDEX,
                "part": {"type": "output_text", "text": ""}}

    @classmethod
    def text_delta(cls, s: StreamState, delta: str) -> dict:
        return {"type": "response.output_text.delta", "sequence_number": s.seq(),
                "item_id": s.item_id,
                "output_index": cls.OUTPUT_INDEX,
                "content_index": cls.CONTENT_INDEX,
                "delta": delta}

    @classmethod
    def text_done(cls, s: StreamState) -> dict:
        return {"type": "response.output_text.done", "sequence_number": s.seq(),
                "item_id": s.item_id,
                "output_index": cls.OUTPUT_INDEX,
                "content_index": cls.CONTENT_INDEX,
                "text": s.final_text or s.full_text}

    @classmethod
    def content_part_done(cls, s: StreamState) -> dict:
        return {"type": "response.content_part.done", "sequence_number": s.seq(),
                "item_id": s.item_id,
                "output_index": cls.OUTPUT_INDEX,
                "content_index": cls.CONTENT_INDEX,
                "part": {"type": "output_text", "text": s.final_text or s.full_text}}

    @classmethod
    def output_item_done(cls, s: StreamState) -> dict:
        text = s.final_text or s.full_text
        return {"type": "response.output_item.done", "sequence_number": s.seq(),
                "output_index": cls.OUTPUT_INDEX,
                "item": {"id": s.item_id, "type": "message", "role": "assistant",
                         "status": "completed",
                         "content": [{"type": "output_text", "text": text}]}}

    @classmethod
    def completed(cls, s: StreamState) -> dict:
        text = s.final_text or s.full_text
        return {"type": "response.completed", "sequence_number": s.seq(),
                "response": {"id": s.response_id, "status": "completed",
                             "usage": {"input_tokens": s.usage_input_tokens,
                                       "output_tokens": s.usage_output_tokens,
                                       "total_tokens": s.usage_total_tokens},
                             "output": [{"id": s.item_id, "type": "message",
                                         "role": "assistant", "status": "completed",
                                         "content": [{"type": "output_text", "text": text}]}]}}

    @classmethod
    def fc_item_added(cls, s: StreamState, tc: ToolCallState) -> dict:
        return {"type": "response.output_item.added", "sequence_number": s.seq(),
                "output_index": tc.output_index,
                "item": {"id": tc.item_id, "type": "function_call", "status": "in_progress",
                         "call_id": tc.call_id, "name": tc.name, "arguments": ""}}

    @classmethod
    def fc_args_delta(cls, s: StreamState, tc: ToolCallState, delta: str) -> dict:
        return {"type": "response.function_call_arguments.delta", "sequence_number": s.seq(),
                "item_id": tc.item_id, "output_index": tc.output_index,
                "call_id": tc.call_id, "delta": delta}

    @classmethod
    def fc_args_done(cls, s: StreamState, tc: ToolCallState) -> dict:
        return {"type": "response.function_call_arguments.done", "sequence_number": s.seq(),
                "item_id": tc.item_id, "output_index": tc.output_index,
                "call_id": tc.call_id, "arguments": tc.args}

    @classmethod
    def fc_item_done(cls, s: StreamState, tc: ToolCallState) -> dict:
        return {"type": "response.output_item.done", "sequence_number": s.seq(),
                "output_index": tc.output_index,
                "item": {"id": tc.item_id, "type": "function_call", "status": "completed",
                         "call_id": tc.call_id, "name": tc.name, "arguments": tc.args}}

    @classmethod
    def tool_result_done(cls, s: StreamState, item_id: str, tool_call_id: str, tool_name: str, content: str) -> dict:
        idx = s.next_tool_output_index
        s.next_tool_output_index += 1
        return {"type": "response.output_item.done", "sequence_number": s.seq(),
                "output_index": idx,
                "item": {"id": item_id, "name": tool_name, "type": "message", "role": "tool", "status": "completed",
                         "content": [{"type": "input_text", "text": content}],
                         "tool_call_id": tool_call_id}}


# ============================================================
# Chunk Handlers
# ============================================================

class ChunkHandler:
    def __init__(self, state: StreamState):
        self.state = state
        self._eb = EventBuilder

    def serialize(self, event: dict) -> str:
        return f"event: {event['type']}\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"

    def handle_messages_chunk(self, chunk: dict) -> list[str]:
        """Handle messages mode chunks — skip tool messages (handled by updates mode)."""
        token, _ = chunk["data"]
        if token.type == "tool":
            return []
        if token.type == "ai":
            if token.tool_call_chunks:
                return self._handle_ai_tool_chunks(token)
            if token.content:
                return self._handle_ai_text(token)
        return []

    def handle_updates_chunk(self, chunk: dict) -> list[str]:
        """Extract events from updates chunks and yield SSE lines."""
        out = []
        for node_data in chunk.get("data", {}).values():
            if not isinstance(node_data, dict):
                continue
            for msg in node_data.get("messages", []):
                out.extend(self._handle_message(msg))
        return out

    def _handle_message(self, msg) -> list[str]:
        msg_type = getattr(msg, "type", None)
        if msg_type == "ai":
            return self._handle_ai_message(msg)
        elif msg_type == "tool":
            return self._handle_tool_message(msg)
        return []

    def _handle_ai_message(self, msg) -> list[str]:
        out = []
        s = self.state
        tool_calls = getattr(msg, "tool_calls", []) or []
        for tc in tool_calls:
            idx = tool_calls.index(tc)
            call_id = tc.get("id", f"call_{uuid.uuid4().hex[:12]}")
            name = tc.get("name", "")
            args = tc.get("args", "")

            tc_state = s.new_tool_call(idx, call_id, name)
            out.append(self.serialize(self._eb.fc_item_added(s, tc_state)))

            if args:
                tc_state.args = args
                # out.append(self.serialize(self._eb.fc_args_delta(s, tc_state, args)))
                # out.append(self.serialize(self._eb.fc_args_done(s, tc_state)))
                out.append(self.serialize(self._eb.fc_item_done(s, tc_state)))

        content = getattr(msg, "content", "") or ""
        if content:
            s.full_text += content
            s.final_text = content
            out.append(self.serialize(self._eb.text_delta(s, content)))
        return out

    def _handle_tool_message(self, msg) -> list[str]:
        s = self.state
        content = getattr(msg, "content", "") or ""
        tool_call_id = getattr(msg, "tool_call_id", "")
        tool_name = getattr(msg, "name", "")
        item_id = f"tool_{uuid.uuid4().hex[:16]}"
        log.info("[debug] ToolMessage tool_call_id=%s content=%s", tool_call_id, repr(content))
        return [
            self.serialize(self._eb.tool_result_done(s, item_id, tool_call_id, tool_name, content)),
        ]

    def _handle_ai_tool_chunks(self, token) -> list[str]:
        out = []
        s = self.state
        for tc_chunk in token.tool_call_chunks:
            idx = tc_chunk.get("index", 0)
            if tc_chunk.get("id"):
                tc = s.new_tool_call(idx, tc_chunk["id"], tc_chunk.get("name", ""))
                out.append(self.serialize(self._eb.fc_item_added(s, tc)))
            if tc_chunk.get("args") and idx in s.tool_calls:
                tc = s.tool_calls[idx]
                tc.args += tc_chunk["args"]
                out.append(self.serialize(self._eb.fc_args_delta(s, tc, tc_chunk["args"])))
        return out

    def _handle_ai_text(self, token) -> list[str]:
        s = self.state
        s.full_text += token.content
        return [self.serialize(self._eb.text_delta(s, token.content))]


# ============================================================
# Agent Builder
# ============================================================

class AgentBuilder:
    def __init__(self, auth_token: str):
        self.auth_token = auth_token

    def get_system_prompt(self) -> str:
        return (PROMPTS_DIR / "system_prompt.md").read_text(encoding="utf-8")

    async def build(self):
        llm = ChatOpenAI(
            model=settings.model_name,
            api_key=settings.dashscope_api_key,
            base_url=settings.dashscope_base_url,
            use_responses_api=False,
            temperature=0.1,
            streaming=True,
            max_tokens=128000,
            model_kwargs={
                "stream_options": {"include_usage": True},
            },
        )
        tools = await self._build_tools()
        log.info("tools: %s", [t.name for t in tools])
        agent = deepagents.create_deep_agent(
            model=llm,
            tools=tools,
            system_prompt=self.get_system_prompt(),
        )
        return agent

    async def _build_tools(self) -> list:
        local_tools = [parse_file_tool, get_supported_chart_types, get_chart_guide, render_chart]
        mcp_config = {
            "transport": "http",
            "url": settings.mcp_server_url,
            "headers": {"Authorization": self.auth_token},
        }
        log.info("Initializing MCP client with config: %s", mcp_config)
        mcp_client = MultiServerMCPClient({"mcp": mcp_config})
        mcp_tools = await mcp_client.get_tools()
        log.info("Retrieved MCP tools: %s", [tool.name for tool in mcp_tools])
        return local_tools + mcp_tools


# ============================================================
# Stream Response
# ============================================================
class StreamResponse:
    def __init__(self, agent, input_text: str, session_id: str = None):
        self.agent = agent
        self.input_text = input_text
        self.session_id = session_id
        self.state = StreamState()
        self.handler = ChunkHandler(self.state)
        self._eb = EventBuilder

    def _serialize(self, event: dict) -> str:
        return f"event: {event['type']}\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"

    def _accumulate_usage(self, usage):
        """累加 token usage，input_tokens 只在首次有值时赋值，output_tokens 累加。"""
        s = self.state
        if isinstance(usage, dict):
            input_tokens = usage.get("input_tokens", 0)
            output_tokens = usage.get("output_tokens", 0)
        else:
            input_tokens = getattr(usage, "input_tokens", 0)
            output_tokens = getattr(usage, "output_tokens", 0)

        if s.usage_input_tokens == 0:
            s.usage_input_tokens = input_tokens
        s.usage_output_tokens += output_tokens
        s.usage_total_tokens = s.usage_input_tokens + s.usage_output_tokens

    async def stream(self) -> AsyncGenerator[str, None]:
        s = self.state
        for event in [self._eb.created(s), self._eb.in_progress(s),
                      self._eb.output_item_added(s), self._eb.content_part_added(s)]:
            yield self._serialize(event)

        async for chunk in self.agent.astream(
            {"messages": [{"role": "user", "content": self.input_text}]},
            stream_mode=["updates", "messages", "custom"],
            version="v2",
        ):
            log.debug("Received chunk: %s", chunk)
            chunk_type = chunk.get("type")

            if chunk_type == "messages":
                for line in self.handler.handle_messages_chunk(chunk):
                    yield line
                token, _ = chunk.get("data", (None, None))
                if token and hasattr(token, "usage") and token.usage:
                    self._accumulate_usage(token.usage)

            elif chunk_type == "updates":
                for line in self.handler.handle_updates_chunk(chunk):
                    yield line
                for node_data in chunk.get("data", {}).values():
                    if not isinstance(node_data, dict):
                        continue
                    for msg in node_data.get("messages", []):
                        usage = getattr(msg, "usage_metadata", None) or {}
                        if usage:
                            self._accumulate_usage(usage)

            elif chunk_type == "custom":
                yield f"event: custom\ndata: {json.dumps(chunk, ensure_ascii=False)}\n\n"

            else:
                log.info("Unknown chunk type: %s", chunk_type)

        for event in [self._eb.text_done(s), self._eb.content_part_done(s),
                      self._eb.output_item_done(s), self._eb.completed(s)]:
            yield self._serialize(event)


# ============================================================
# FastAPI Route
# ============================================================

async def data_agent(auth_token: str, request: ResponseRequest):
    builder = AgentBuilder(auth_token)
    agent = await builder.build()

    input_data: InputData = request.input
    file_path = input_data.file_path
    file_id = input_data.file_id
    user_input = input_data.input

    context = ""
    if file_path:
        context = f"""
任务参数：

file_id={file_id}
oss_path={file_path}
---

"""
    full_input = context + user_input

    log.info("Input: %s", full_input)
    streamer = StreamResponse(agent, full_input, request.session_id)
    return StreamingResponse(
        streamer.stream(),
        media_type="text/event-stream"
    )

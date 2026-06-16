from pydantic import BaseModel, Field
from typing import Optional


class InputData(BaseModel):
    file_id: Optional[str] = Field(default=None, description="Uploaded file ID")
    file_path: Optional[str] = Field(default=None, description="Uploaded file OSS path")
    input: str = Field(description="User input text")


class ResponseRequest(BaseModel):
    session_id: Optional[str] = Field(default=None, description="Session ID for context")
    input: InputData = Field(description="Input data with file_id, file_url, input fields")
    model: Optional[str] = None

import time
from typing import Any


class TTLCache:
    """In-memory cache with TTL (time-to-live) support."""

    def __init__(self, ttl: int = 3600):
        """
        Initialize the cache.

        Args:
            ttl: Time-to-live in seconds (default: 1 hour)
        """
        self._cache: dict[str, tuple[Any, float]] = {}
        self._ttl = ttl

    def get(self, key: str) -> Any | None:
        """Get value from cache if not expired."""
        if key in self._cache:
            value, timestamp = self._cache[key]
            if time.time() - timestamp < self._ttl:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        """Set value in cache with current timestamp."""
        self._cache[key] = (value, time.time())

    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()


# Global cache instance (1 hour TTL)
_cache = TTLCache(ttl=3600)


def get_from_cache(key: str) -> str | None:
    """Get value from global cache if not expired."""
    return _cache.get(key)


def set_cache(key: str, value: str) -> None:
    """Set value in global cache with current timestamp."""
    _cache.set(key, value)

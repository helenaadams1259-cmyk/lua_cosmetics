from typing import Any, List

from pydantic import BaseModel


class PaginatedResponse(BaseModel):
    data: List[Any]
    total: int
    maxPage: int

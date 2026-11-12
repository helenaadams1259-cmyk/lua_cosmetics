from typing import Any, Dict, List, Optional

from app.repositories.base_repository import BaseRepository


class BaseService:
    def __init__(self, repository: BaseRepository):
        self._repo = repository

    def create(self, payload: Dict[str, Any]) -> dict:
        return self._repo.add(payload)

    def list(self, offset: int = 0, limit: Optional[int] = None) -> List[dict]:
        return self._repo.list(offset=offset, limit=limit)

    def count(self) -> int:
        return self._repo.count()

    def get(self, entity_id: int) -> Optional[dict]:
        return self._repo.get(entity_id)

    def update(self, entity_id: int, payload: Dict[str, Any]) -> Optional[dict]:
        return self._repo.update(entity_id, payload)

    def delete(self, entity_id: int) -> bool:
        return self._repo.delete(entity_id)

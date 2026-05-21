"""
Defect schemas — re-exported from aircraft.py for backwards compatibility.
DefectCreate, DefectOut, and ResolveDefectRequest now live in app.schemas.aircraft.
"""
from app.schemas.aircraft import DefectCreate, DefectOut, ResolveDefectRequest

__all__ = ["DefectCreate", "DefectOut", "ResolveDefectRequest"]

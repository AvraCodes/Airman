# API Contract

- POST `/sorties/{id}/release`: dispatcher only.
- POST `/sorties/{id}/status`: validates transition graph.
- POST `/training-progress`: instructor only.
- POST `/training-progress/{id}/approve`: CFI only.
- POST `/defects`: grounds aircraft.
- GET `/audit-logs`: returns actions timeline.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import crud, schemas, models
from typing import List, Optional
router = APIRouter()

@router.get("/dashboard", response_model=schemas.DashboardStats)
def read_dashboard(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)

# ============================================
# MEMBERS ENDPOINTS
# ============================================
@router.get("/membres", response_model=List[schemas.Membre])
def read_membres(db: Session = Depends(get_db)):
    return crud.get_membres(db)

@router.get("/membres/{id_membre}", response_model=schemas.Membre)
def read_membre(id_membre: int, db: Session = Depends(get_db)):
    db_membre = crud.get_membre_by_id(db, id_membre)
    if db_membre is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_membre

@router.post("/membres", response_model=schemas.Membre)
def create_membre(membre: schemas.MembreCreate, db: Session = Depends(get_db)):
    return crud.create_membre(db, membre)

@router.put("/membres/{id_membre}", response_model=schemas.Membre)
def update_membre(id_membre: int, membre: schemas.MembreBase, db: Session = Depends(get_db)):
    # Convert to dict and filter out None values
    update_data = {k: v for k, v in membre.dict().items() if v is not None}
    db_membre = crud.update_membre(db, id_membre, update_data)
    if db_membre is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_membre

@router.delete("/membres/{id_membre}")
def delete_membre(id_membre: int, db: Session = Depends(get_db)):
    success = crud.delete_membre(db, id_membre)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member deleted successfully"}

# ============================================
# TONTINES ENDPOINTS
# ============================================
@router.get("/tontines")
def read_tontines(db: Session = Depends(get_db)):
    tontines = crud.get_tontines(db)
    # Adding calculated field for frontend
    result = []
    for t in tontines:
        t_dict = {
            "id_tontine": t.id_tontine,
            "type": t.type,
            "montant_cotisation": t.montant_cotisation,
            "periode": t.periode,
            "description": t.description,
            "date_debut": t.date_debut,
            "statut": t.statut,
            "membres_count": len(t.membres)
        }
        result.append(t_dict)
    return result

@router.get("/tontines/{id_tontine}", response_model=schemas.Tontine)
def read_tontine(id_tontine: int, db: Session = Depends(get_db)):
    db_tontine = crud.get_tontine_by_id(db, id_tontine)
    if db_tontine is None:
        raise HTTPException(status_code=404, detail="Tontine not found")
    return db_tontine

@router.post("/tontines", response_model=schemas.Tontine)
def create_tontine(tontine: schemas.TontineCreate, db: Session = Depends(get_db)):
    return crud.create_tontine(db, tontine)

@router.put("/tontines/{id_tontine}", response_model=schemas.Tontine)
def update_tontine(id_tontine: int, tontine: schemas.TontineBase, db: Session = Depends(get_db)):
    update_data = {k: v for k, v in tontine.dict().items() if v is not None}
    db_tontine = crud.update_tontine(db, id_tontine, update_data)
    if db_tontine is None:
        raise HTTPException(status_code=404, detail="Tontine not found")
    return db_tontine

@router.delete("/tontines/{id_tontine}")
def delete_tontine(id_tontine: int, db: Session = Depends(get_db)):
    success = crud.delete_tontine(db, id_tontine)
    if not success:
        raise HTTPException(status_code=404, detail="Tontine not found")
    return {"message": "Tontine deleted successfully"}

# ============================================
# SESSIONS (SEANCES) ENDPOINTS
# ============================================
@router.get("/seances", response_model=List[schemas.Seance])
def read_seances(id_tontine: Optional[int] = None, db: Session = Depends(get_db)):
    seances = crud.get_seances(db)
    if id_tontine:
        seances = [s for s in seances if s.id_tontine == id_tontine]
    return seances

@router.get("/seances/{id_seance}", response_model=schemas.Seance)
def read_seance(id_seance: int, db: Session = Depends(get_db)):
    db_seance = crud.get_seance_by_id(db, id_seance)
    if db_seance is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_seance

@router.post("/seances", response_model=schemas.Seance)
def create_seance(seance: schemas.SeanceCreate, db: Session = Depends(get_db)):
    return crud.create_seance(db, seance)

@router.put("/seances/{id_seance}", response_model=schemas.Seance)
def update_seance(id_seance: int, seance: schemas.SeanceCreate, db: Session = Depends(get_db)):
    update_data = {k: v for k, v in seance.dict().items() if v is not None}
    db_seance = crud.update_seance(db, id_seance, update_data)
    if db_seance is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_seance

@router.delete("/seances/{id_seance}")
def delete_seance(id_seance: int, db: Session = Depends(get_db)):
    success = crud.delete_seance(db, id_seance)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}

# ============================================
# OTHER ENDPOINTS
# ============================================
@router.post("/tours")
def create_beneficiary_turn(tour: schemas.TourCreate, db: Session = Depends(get_db)):
    return crud.create_tour_logic(db, tour)

@router.get("/reports/situation_membre/{id_membre}")
def member_financial_report(id_membre: int, db: Session = Depends(get_db)):
    cotis = db.query(models.Cotisation).filter_by(id_membre=id_membre).all()
    pens = db.query(models.Penalite).filter_by(id_membre=id_membre).all()
    creds = db.query(models.Credit).filter_by(id_membre=id_membre).all()
    gains = db.query(models.Tour).filter_by(id_membre=id_membre).all()
    
    return {
        "total_cotise": sum(c.montant for c in cotis),
        "total_penalites": sum(p.montant for p in pens),
        "total_emprunte": sum(cr.montant for cr in creds),
        "total_gagne": sum(g.montant_distribue for g in gains)
    }

# Additional routers for Seances, Credits, Projects would follow the same pattern...
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
    db_membre = crud.create_membre(db, membre)
    if db_membre is None:
        raise HTTPException(
            status_code=400, 
            detail="A member with this email already exists"
        )
    return db_membre

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

@router.get("/membres/{id_membre}/tontines", response_model=List[schemas.MemberTontineParticipation])
def get_member_tontines(id_membre: int, db: Session = Depends(get_db)):
    """
    Get all tontines a member is registered to with their participation details
    """
    member = crud.get_membre_by_id(db, id_membre)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return crud.get_member_tontines(db, id_membre)

@router.post("/membres/{id_membre}/register")
def register_member_to_tontine(
    id_membre: int, 
    registration: schemas.RegisterToTontineRequest, 
    db: Session = Depends(get_db)
):
    """
    Register a member to a tontine (PARTICIPE relationship)
    Business Rules:
    - Member cannot register twice to the same tontine
    - For 'presence' tontines, nb_parts is forced to 1
    - For 'optionnelle' tontines, nb_parts must be >= 1
    """
    # Check if member exists
    member = crud.get_membre_by_id(db, id_membre)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    result = crud.add_membre_to_tontine(
        db, 
        id_membre, 
        registration.id_tontine, 
        registration.nb_parts
    )
    
    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Member is already registered to this tontine or tontine not found"
        )
    
    return result

# ============================================
# TONTINES ENDPOINTS
# ============================================
@router.get("/tontines")
def read_tontines(db: Session = Depends(get_db)):
    tontines = crud.get_tontines(db)
    # Adding calculated field for frontend
    result = []
    for t in tontines:
        # Count members from the membre_tontine table
        membres_count = db.execute(
            models.membre_tontine.select().where(
                models.membre_tontine.c.id_tontine == t.id_tontine
            )
        ).fetchall()
        
        t_dict = {
            "id_tontine": t.id_tontine,
            "type": t.type,
            "montant_cotisation": t.montant_cotisation,
            "periode": t.periode,
            "description": t.description,
            "date_debut": t.date_debut,
            "date_fin": t.date_fin,
            "statut": t.statut,
            "membres_count": len(membres_count)
        }
        result.append(t_dict)
    return result

@router.get("/tontines/{id_tontine}", response_model=schemas.Tontine)
def read_tontine(id_tontine: int, db: Session = Depends(get_db)):
    db_tontine = crud.get_tontine_by_id(db, id_tontine)
    if db_tontine is None:
        raise HTTPException(status_code=404, detail="Tontine not found")
    return db_tontine

@router.get("/tontines/{id_tontine}/members", response_model=List[schemas.TontineMemberParticipation])
def get_tontine_members(id_tontine: int, db: Session = Depends(get_db)):
    """
    Get all members registered to a tontine with their participation details
    """
    tontine = crud.get_tontine_by_id(db, id_tontine)
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine not found")
    
    return crud.get_tontine_members(db, id_tontine)

@router.post("/tontines", response_model=schemas.Tontine)
def create_tontine(tontine: schemas.TontineCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_tontine(db, tontine)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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

@router.get("/seances/{id_seance}/attendance")
def get_session_attendance(id_seance: int, db: Session = Depends(get_db)):
    """
    Get all members subscribed to the tontine associated with this session,
    with their expected contribution amount based on nb_parts.
    """
    attendance = crud.get_session_attendance(db, id_seance)
    return attendance

@router.post("/seances", response_model=schemas.Seance)
def create_seance(seance: schemas.SeanceCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_seance(db, seance)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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

@router.post("/seances/{id_seance}/close", response_model=schemas.CloseSessionResponse)
def close_session(id_seance: int, close_request: schemas.CloseSessionRequest, db: Session = Depends(get_db)):
    """
    Close a session:
    - Update status to 'cloturee' (Closed)
    - For 'presence' tontines, automatically create penalties for absent members
    - Return summary of penalties created and totals
    """
    result = crud.close_session(db, id_seance, close_request)
    if result is None:
        raise HTTPException(status_code=404, detail="Session or tontine not found")
    return result

@router.post("/seances/{id_seance}/save-meeting", response_model=schemas.SaveMeetingResponse)
def save_session_meeting(id_seance: int, save_request: schemas.SaveMeetingRequest, db: Session = Depends(get_db)):
    """
    Save attendance sheet for a session:
    - Create contributions for present members who paid
    - Create penalties for absent members (presence tontines only)
    - Update session status to 'tenue' (held)
    """
    try:
        result = crud.save_session_meeting(db, id_seance, save_request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# CONTRIBUTIONS (COTISATIONS) ENDPOINTS
# ============================================
@router.post("/cotisations", response_model=schemas.Cotisation)
def create_cotisation(cotisation: schemas.CotisationCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_cotisation(db, cotisation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cotisations/bulk", response_model=List[schemas.Cotisation])
def create_bulk_cotisations(bulk_request: schemas.BulkCotisationCreate, db: Session = Depends(get_db)):
    """
    Create multiple contributions in a single request to avoid multiple network calls
    """
    return crud.create_bulk_cotisations(db, bulk_request.cotisations)

@router.get("/seances/{id_seance}/cotisations", response_model=List[schemas.Cotisation])
def get_session_cotisations(id_seance: int, db: Session = Depends(get_db)):
    return crud.get_cotisations_by_seance(db, id_seance)

# ============================================
# PENALTIES (PENALITES) ENDPOINTS
# ============================================
@router.get("/penalites", response_model=List[schemas.Penalite])
def get_penalites(id_membre: Optional[int] = None, id_seance: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all penalties, optionally filtered by member or session"""
    if id_membre:
        return crud.get_penalites_by_membre(db, id_membre)
    if id_seance:
        return crud.get_penalites_by_seance(db, id_seance)
    return crud.get_penalites(db)

@router.get("/penalites/{id_penalite}", response_model=schemas.Penalite)
def get_penalite(id_penalite: int, db: Session = Depends(get_db)):
    """Get a single penalty by ID"""
    db_penalite = crud.get_penalite_by_id(db, id_penalite)
    if db_penalite is None:
        raise HTTPException(status_code=404, detail="Penalty not found")
    return db_penalite

@router.post("/penalites", response_model=schemas.Penalite)
def create_penalite(penalite: schemas.PenaliteCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_penalite(db, penalite)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/penalites/{id_penalite}", response_model=schemas.Penalite)
def update_penalite(id_penalite: int, penalite: schemas.PenaliteUpdate, db: Session = Depends(get_db)):
    """Update a penalty (e.g., mark as paid)"""
    update_data = {k: v for k, v in penalite.dict().items() if v is not None}
    db_penalite = crud.update_penalite(db, id_penalite, update_data)
    if db_penalite is None:
        raise HTTPException(status_code=404, detail="Penalty not found")
    return db_penalite

@router.delete("/penalites/{id_penalite}")
def delete_penalite(id_penalite: int, db: Session = Depends(get_db)):
    """Delete a penalty"""
    success = crud.delete_penalite(db, id_penalite)
    if not success:
        raise HTTPException(status_code=404, detail="Penalty not found")
    return {"message": "Penalty deleted successfully"}

# ============================================
# TOURS (GAINS) ENDPOINTS
# ============================================
@router.get("/tours", response_model=List[schemas.Tour])
def get_tours(id_tontine: Optional[int] = None, id_membre: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all tours, optionally filtered by tontine or member"""
    if id_tontine:
        tours = crud.get_tours_by_tontine(db, id_tontine)
    elif id_membre:
        tours = crud.get_tours_by_membre(db, id_membre)
    else:
        tours = crud.get_tours(db)
    
    # Enrich with beneficiary names
    result = []
    for tour in tours:
        tour_dict = {
            "id_tour": tour.id_tour,
            "numero": tour.numero,
            "date": tour.date,
            "montant_distribue": tour.montant_distribue,
            "id_membre": tour.id_membre,
            "id_tontine": tour.id_tontine,
            "beneficiaire_nom": tour.beneficiaire.nom if tour.beneficiaire else None,
            "beneficiaire_prenom": tour.beneficiaire.prenom if tour.beneficiaire else None
        }
        result.append(tour_dict)
    return result

@router.get("/tours/{id_tour}", response_model=schemas.Tour)
def get_tour(id_tour: int, db: Session = Depends(get_db)):
    """Get a single tour by ID"""
    db_tour = crud.get_tour_by_id(db, id_tour)
    if db_tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    return {
        "id_tour": db_tour.id_tour,
        "numero": db_tour.numero,
        "date": db_tour.date,
        "montant_distribue": db_tour.montant_distribue,
        "id_membre": db_tour.id_membre,
        "id_tontine": db_tour.id_tontine,
        "beneficiaire_nom": db_tour.beneficiaire.nom if db_tour.beneficiaire else None,
        "beneficiaire_prenom": db_tour.beneficiaire.prenom if db_tour.beneficiaire else None
    }

@router.post("/tours", response_model=schemas.Tour)
def create_tour(tour: schemas.TourCreate, db: Session = Depends(get_db)):
    """
    Create a new tour (assign beneficiary)
    Business Rule: Validates member hasn't already received in this cycle
    """
    # Check if member already received
    if crud.has_member_received_tour(db, tour.id_tontine, tour.id_membre):
        raise HTTPException(
            status_code=400,
            detail="Member has already received a tour in this tontine cycle"
        )
    
    db_tour = crud.create_tour(db, tour)
    if db_tour is None:
        raise HTTPException(status_code=404, detail="Member or Tontine not found")
    
    return {
        "id_tour": db_tour.id_tour,
        "numero": db_tour.numero,
        "date": db_tour.date,
        "montant_distribue": db_tour.montant_distribue,
        "id_membre": db_tour.id_membre,
        "id_tontine": db_tour.id_tontine,
        "beneficiaire_nom": db_tour.beneficiaire.nom if db_tour.beneficiaire else None,
        "beneficiaire_prenom": db_tour.beneficiaire.prenom if db_tour.beneficiaire else None
    }

@router.delete("/tours/{id_tour}")
def delete_tour(id_tour: int, db: Session = Depends(get_db)):
    """Delete a tour"""
    success = crud.delete_tour(db, id_tour)
    if not success:
        raise HTTPException(status_code=404, detail="Tour not found")
    return {"message": "Tour deleted successfully"}

@router.get("/tours/tontine/{id_tontine}/next-number")
def get_next_tour_number(id_tontine: int, db: Session = Depends(get_db)):
    """Get the next tour number for a tontine"""
    next_num = crud.get_next_tour_number(db, id_tontine)
    return {"next_numero": next_num}

@router.get("/tours/tontine/{id_tontine}/eligible-beneficiaries")
def get_eligible_beneficiaries(id_tontine: int, db: Session = Depends(get_db)):
    """Get members who haven't received a tour yet in this tontine"""
    eligible = crud.get_eligible_beneficiaries(db, id_tontine)
    return [{"id_membre": m.id_membre, "nom": m.nom, "prenom": m.prenom} for m in eligible]

@router.get("/seances/{id_seance}/total-contributions")
def get_session_total(id_seance: int, db: Session = Depends(get_db)):
    """Get total contributions for a session (for tour distribution)"""
    total = crud.get_session_total_contributions(db, id_seance)
    return {"total": total}

# ============================================
# PROJECTS (PROJETS) ENDPOINTS
# ============================================
@router.get("/projets", response_model=List[schemas.Projet])
def get_projets(id_tontine: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all projects, optionally filtered by tontine"""
    if id_tontine:
        return crud.get_projets_by_tontine(db, id_tontine)
    return crud.get_projets(db)

@router.get("/projets/{id_projet}", response_model=schemas.Projet)
def get_projet(id_projet: int, db: Session = Depends(get_db)):
    """Get a single project by ID"""
    db_projet = crud.get_projet_by_id(db, id_projet)
    if db_projet is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_projet

@router.post("/projets", response_model=schemas.Projet)
def create_projet(projet: schemas.ProjetCreate, db: Session = Depends(get_db)):
    """Create a new project (FIAC)"""
    db_projet = crud.create_projet(db, projet)
    if db_projet is None:
        raise HTTPException(status_code=404, detail="Tontine not found")
    return db_projet

@router.put("/projets/{id_projet}", response_model=schemas.Projet)
def update_projet(id_projet: int, projet: schemas.ProjetUpdate, db: Session = Depends(get_db)):
    """Update a project"""
    update_data = {k: v for k, v in projet.dict().items() if v is not None}
    db_projet = crud.update_projet(db, id_projet, update_data)
    if db_projet is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_projet

@router.delete("/projets/{id_projet}")
def delete_projet(id_projet: int, db: Session = Depends(get_db)):
    """Delete a project"""
    success = crud.delete_projet(db, id_projet)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

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

# ============================================
# CREDITS ENDPOINTS
# ============================================

@router.get("/credits", response_model=List[schemas.Credit])
def get_credits(id_membre: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Get all credits or filter by member
    Also updates overdue credits status
    """
    # Update overdue credits first
    crud.update_overdue_credits(db)
    
    if id_membre:
        return crud.get_credits_by_member(db, id_membre)
    return crud.get_credits(db)

@router.get("/credits/{id_credit}", response_model=schemas.Credit)
def get_credit(id_credit: int, db: Session = Depends(get_db)):
    """
    Get a single credit by ID
    """
    db_credit = crud.get_credit_by_id(db, id_credit)
    if db_credit is None:
        raise HTTPException(status_code=404, detail="Credit not found")
    return db_credit

@router.post("/credits", response_model=schemas.Credit)
def create_credit(credit: schemas.CreditCreate, db: Session = Depends(get_db)):
    """
    Create a new credit request
    Business Rule: A member cannot contract a new credit if they have an active credit
    (status 'en_cours' or 'en_retard')
    """
    # Check if member has active credit
    if crud.has_active_credit(db, credit.id_membre):
        raise HTTPException(
            status_code=400,
            detail="Member already has an active credit. Cannot request a new credit until current one is repaid."
        )
    
    # Verify member exists and create credit
    db_credit = crud.create_credit(db, credit)
    if db_credit is None:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return db_credit

@router.patch("/credits/{id_credit}/repay", response_model=schemas.Credit)
def repay_credit(id_credit: int, repayment: schemas.CreditRepayment, db: Session = Depends(get_db)):
    """
    Process a credit repayment
    Updates the remaining balance and marks as 'rembourse' if fully paid
    """
    db_credit = crud.repay_credit(db, id_credit, repayment.montant_paye)
    if db_credit is None:
        raise HTTPException(status_code=404, detail="Credit not found")
    return db_credit

# ============================================
# REPORTING ENDPOINTS (E-ÉTATS)
# ============================================

@router.get("/reports/session/{id_seance}")
def get_session_report_data(id_seance: int, db: Session = Depends(get_db)):
    """
    Get comprehensive session data for PDF report generation
    Includes: session details, contributions, beneficiary (tour), absences, penalties
    """
    return crud.get_session_report_data(db, id_seance)

@router.get("/reports/member/{id_membre}/financial")
def get_member_financial_report(id_membre: int, db: Session = Depends(get_db)):
    """
    Get detailed financial statement for a member
    Includes: all contributions, active credits, penalties, net balance
    """
    return crud.get_member_financial_report(db, id_membre)

@router.get("/reports/ag-synthesis")
def get_ag_synthesis_report(id_tontine: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Get comprehensive data for General Assembly synthesis report
    Includes: global financial dashboard, project investments (FIAC), emergency fund status
    """
    return crud.get_ag_synthesis_report(db, id_tontine)

# Additional routers for Projects would follow the same pattern...
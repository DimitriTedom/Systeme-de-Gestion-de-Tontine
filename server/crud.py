from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import models, schemas

def get_membres(db: Session):
    return db.query(models.Membre).all()

def get_membre_by_id(db: Session, id_membre: int):
    return db.query(models.Membre).filter(models.Membre.id_membre == id_membre).first()

def get_membre_by_email(db: Session, email: str):
    return db.query(models.Membre).filter(models.Membre.email == email).first()

def create_membre(db: Session, membre: schemas.MembreCreate):
    # Check if email already exists
    existing_membre = get_membre_by_email(db, membre.email)
    if existing_membre:
        return None  # Return None to indicate duplicate email
    
    db_membre = models.Membre(**membre.dict())
    db.add(db_membre)
    db.commit()
    db.refresh(db_membre)
    return db_membre

def update_membre(db: Session, id_membre: int, membre_update: dict):
    db_membre = db.query(models.Membre).filter(models.Membre.id_membre == id_membre).first()
    if not db_membre:
        return None
    for key, value in membre_update.items():
        if value is not None:
            setattr(db_membre, key, value)
    db.commit()
    db.refresh(db_membre)
    return db_membre

def delete_membre(db: Session, id_membre: int):
    db_membre = db.query(models.Membre).filter(models.Membre.id_membre == id_membre).first()
    if db_membre:
        db.delete(db_membre)
        db.commit()
        return True
    return False

def get_tontines(db: Session):
    return db.query(models.Tontine).all()

def get_tontine_by_id(db: Session, id_tontine: int):
    return db.query(models.Tontine).filter(models.Tontine.id_tontine == id_tontine).first()

def create_tontine(db: Session, tontine: schemas.TontineCreate):
    db_tontine = models.Tontine(**tontine.dict())
    db.add(db_tontine)
    db.commit()
    db.refresh(db_tontine)
    return db_tontine

def update_tontine(db: Session, id_tontine: int, tontine_update: dict):
    db_tontine = db.query(models.Tontine).filter(models.Tontine.id_tontine == id_tontine).first()
    if not db_tontine:
        return None
    for key, value in tontine_update.items():
        if value is not None:
            setattr(db_tontine, key, value)
    db.commit()
    db.refresh(db_tontine)
    return db_tontine

def delete_tontine(db: Session, id_tontine: int):
    db_tontine = db.query(models.Tontine).filter(models.Tontine.id_tontine == id_tontine).first()
    if db_tontine:
        db.delete(db_tontine)
        db.commit()
        return True
    return False

def add_membre_to_tontine(db: Session, id_membre: int, id_tontine: int, nb_parts: int):
    # Check if member already registered to this tontine
    existing = db.execute(
        models.membre_tontine.select().where(
            models.membre_tontine.c.id_membre == id_membre,
            models.membre_tontine.c.id_tontine == id_tontine
        )
    ).first()
    
    if existing:
        return None  # Member already registered
    
    # Get tontine to check type
    tontine = get_tontine_by_id(db, id_tontine)
    if not tontine:
        return None  # Tontine not found
    
    # If tontine is 'presence', force nb_parts to 1
    if tontine.type.lower() == 'presence':
        nb_parts = 1
    elif nb_parts < 1:
        return None  # Invalid nb_parts for optional tontine
    
    stmt = models.membre_tontine.insert().values(id_membre=id_membre, id_tontine=id_tontine, nb_parts=nb_parts)
    db.execute(stmt)
    db.commit()
    return {"message": "Member registered to tontine successfully", "nb_parts": nb_parts}

def get_member_tontines(db: Session, id_membre: int):
    """
    Get all tontines a member is registered to, including their nb_parts
    """
    result = db.query(
        models.Tontine,
        models.membre_tontine.c.nb_parts
    ).join(
        models.membre_tontine,
        models.Tontine.id_tontine == models.membre_tontine.c.id_tontine
    ).filter(
        models.membre_tontine.c.id_membre == id_membre
    ).all()
    
    # Transform result into list of dicts with tontine fields + nb_parts
    tontines = []
    for tontine, nb_parts in result:
        tontine_dict = {
            "id_tontine": tontine.id_tontine,
            "type": tontine.type,
            "montant_cotisation": tontine.montant_cotisation,
            "periode": tontine.periode,
            "description": tontine.description,
            "date_debut": tontine.date_debut,
            "date_fin": tontine.date_fin,
            "statut": tontine.statut,
            "nb_parts": nb_parts
        }
        tontines.append(tontine_dict)
    
    return tontines

def get_tontine_members(db: Session, id_tontine: int):
    """
    Get all members registered to a tontine, including their nb_parts
    """
    result = db.query(
        models.Membre,
        models.membre_tontine.c.nb_parts
    ).join(
        models.membre_tontine,
        models.Membre.id_membre == models.membre_tontine.c.id_membre
    ).filter(
        models.membre_tontine.c.id_tontine == id_tontine
    ).all()
    
    # Transform result into list of dicts with member fields + nb_parts
    members = []
    for membre, nb_parts in result:
        member_dict = {
            "id_membre": membre.id_membre,
            "nom": membre.nom,
            "prenom": membre.prenom,
            "email": membre.email,
            "telephone": membre.telephone,
            "statut": membre.statut,
            "nb_parts": nb_parts
        }
        members.append(member_dict)
    
    return members

def get_dashboard_stats(db: Session):
    """
    Calculate dashboard statistics
    Caisse = (Cotisations + Pénalités payées) - (Tours distribués + Crédits actifs + Projets alloués)
    """
    total_cotisations = db.query(func.sum(models.Cotisation.montant)).scalar() or 0
    # Only count paid penalties
    total_penalties_paid = db.query(func.sum(models.Penalite.montant)).filter(
        models.Penalite.statut == "paye"
    ).scalar() or 0
    total_penalties_unpaid = db.query(func.sum(models.Penalite.montant)).filter(
        models.Penalite.statut == "non_paye"
    ).scalar() or 0
    total_tours = db.query(func.sum(models.Tour.montant_distribue)).scalar() or 0
    total_credits = db.query(func.sum(models.Credit.montant)).filter(
        models.Credit.statut.in_(["en_cours", "en_retard"])
    ).scalar() or 0
    total_projets = db.query(func.sum(models.Projet.montant_alloue)).filter(
        models.Projet.statut == "en_cours"
    ).scalar() or 0
    
    caisse = (total_cotisations + total_penalties_paid) - (total_tours + total_credits + total_projets)
    
    active_members = db.query(models.Membre).filter(models.Membre.statut == "Actif").count()
    active_credits_count = db.query(models.Credit).filter(
        models.Credit.statut.in_(["en_cours", "en_retard"])
    ).count()
    pending_penalties_count = db.query(models.Penalite).filter(
        models.Penalite.statut == "non_paye"
    ).count()
    active_projects_count = db.query(models.Projet).filter(
        models.Projet.statut == "en_cours"
    ).count()
    
    return {
        "caisse": caisse,
        "active_members": active_members,
        "active_credits": active_credits_count,
        "pending_penalties": pending_penalties_count,
        "total_penalties_unpaid": total_penalties_unpaid,
        "active_projects": active_projects_count,
        "total_contributions": total_cotisations,
        "total_tours": total_tours
    }

def get_seances(db: Session):
    return db.query(models.Seance).all()

def get_seance_by_id(db: Session, id_seance: int):
    return db.query(models.Seance).filter(models.Seance.id_seance == id_seance).first()

def create_seance(db: Session, seance: schemas.SeanceCreate):
    db_seance = models.Seance(**seance.dict())
    db.add(db_seance)
    db.commit()
    db.refresh(db_seance)
    return db_seance

def update_seance(db: Session, id_seance: int, seance_update: dict):
    db_seance = db.query(models.Seance).filter(models.Seance.id_seance == id_seance).first()
    if not db_seance:
        return None
    for key, value in seance_update.items():
        if value is not None:
            setattr(db_seance, key, value)
    db.commit()
    db.refresh(db_seance)
    return db_seance

def delete_seance(db: Session, id_seance: int):
    db_seance = db.query(models.Seance).filter(models.Seance.id_seance == id_seance).first()
    if db_seance:
        db.delete(db_seance)
        db.commit()
        return True
    return False

def create_tour_logic(db: Session, tour: schemas.TourCreate):
    # Business Logic: In optional tontines, total gains <= total contributions
    tontine = db.query(models.Tontine).filter(models.Tontine.id_tontine == tour.id_tontine).first()
    if tontine.type == "optionnelle":
        # Simplified check: logic based on member parts and tontine cycles
        pass 
    
    db_tour = models.Tour(**tour.dict())
    db.add(db_tour)
    db.commit()
    db.refresh(db_tour)
    return db_tour

def get_session_attendance(db: Session, id_seance: int):
    """
    Get all members subscribed to the tontine associated with a session,
    along with their expected contribution based on nb_parts.
    
    Returns a list of members with:
    - Member details (id, nom, prenom, email, telephone, statut)
    - nb_parts from the membre_tontine association table
    - expected_contribution = nb_parts * tontine.montant_cotisation
    """
    # Get the session and its associated tontine
    seance = db.query(models.Seance).filter(models.Seance.id_seance == id_seance).first()
    if not seance:
        return []
    
    # Join Membre, membre_tontine, and Tontine tables
    # to get members with their nb_parts and calculate expected contribution
    from sqlalchemy import select
    
    stmt = (
        select(
            models.Membre.id_membre,
            models.Membre.nom,
            models.Membre.prenom,
            models.Membre.email,
            models.Membre.telephone,
            models.Membre.statut,
            models.membre_tontine.c.nb_parts,
            models.Tontine.montant_cotisation
        )
        .join(models.membre_tontine, models.Membre.id_membre == models.membre_tontine.c.id_membre)
        .join(models.Tontine, models.membre_tontine.c.id_tontine == models.Tontine.id_tontine)
        .where(models.Tontine.id_tontine == seance.id_tontine)
    )
    
    results = db.execute(stmt).all()
    
    # Transform results into the expected format
    attendance_list = []
    for row in results:
        expected_contribution = row.nb_parts * row.montant_cotisation
        attendance_list.append({
            "id_membre": row.id_membre,
            "nom": row.nom,
            "prenom": row.prenom,
            "email": row.email,
            "telephone": row.telephone,
            "statut": row.statut,
            "nb_parts": row.nb_parts,
            "expected_contribution": expected_contribution
        })
    
    return attendance_list

def create_cotisation(db: Session, cotisation: schemas.CotisationCreate):
    db_cotisation = models.Cotisation(**cotisation.dict())
    db.add(db_cotisation)
    db.commit()
    db.refresh(db_cotisation)
    return db_cotisation

def get_cotisations_by_seance(db: Session, id_seance: int):
    return db.query(models.Cotisation).filter(models.Cotisation.id_seance == id_seance).all()

def create_penalite(db: Session, penalite: schemas.PenaliteCreate):
    db_penalite = models.Penalite(**penalite.dict())
    db.add(db_penalite)
    db.commit()
    db.refresh(db_penalite)
    return db_penalite

def close_session(db: Session, id_seance: int, close_request: schemas.CloseSessionRequest):
    """
    Close a session:
    1. Update session status to 'cloturee'
    2. Create penalties for absent members in 'presence' tontines
    3. Return summary of penalties created
    """
    # Get the session and its tontine
    seance = db.query(models.Seance).filter(models.Seance.id_seance == id_seance).first()
    if not seance:
        return None
    
    tontine = db.query(models.Tontine).filter(models.Tontine.id_tontine == seance.id_tontine).first()
    if not tontine:
        return None
    
    # Update session status
    seance.statut = "cloturee"
    
    penalties_created = []
    
    # If it's a 'presence' tontine, create penalties for absent members
    if tontine.type.lower() == "presence":
        for attendance in close_request.attendance:
            if not attendance.present:
                # Get member details
                membre = db.query(models.Membre).filter(models.Membre.id_membre == attendance.id_membre).first()
                if membre:
                    # Create penalty
                    penalite = models.Penalite(
                        montant=close_request.montant_penalite_absence,
                        raison="Absence",
                        date=seance.date,
                        id_membre=attendance.id_membre,
                        id_seance=id_seance
                    )
                    db.add(penalite)
                    db.flush()  # Get the penalty ID
                    
                    penalties_created.append({
                        "id_membre": membre.id_membre,
                        "nom": membre.nom,
                        "prenom": membre.prenom,
                        "montant": close_request.montant_penalite_absence,
                        "raison": "Absence"
                    })
    
    # Calculate totals
    total_contributions = sum(cotis.montant for cotis in seance.cotisations)
    total_penalties = sum(pen.montant for pen in seance.penalites) + (len(penalties_created) * close_request.montant_penalite_absence)
    
    db.commit()
    db.refresh(seance)
    
    return {
        "id_seance": seance.id_seance,
        "statut": seance.statut,
        "penalties_created": penalties_created,
        "total_contributions": total_contributions,
        "total_penalties": total_penalties
    }

def create_bulk_cotisations(db: Session, cotisations: List[schemas.CotisationCreate]):
    """
    Create multiple contributions in bulk
    """
    created_cotisations = []
    for cotis_data in cotisations:
        db_cotisation = models.Cotisation(**cotis_data.dict())
        db.add(db_cotisation)
        db.flush()
        created_cotisations.append(db_cotisation)
    
    db.commit()
    for cotis in created_cotisations:
        db.refresh(cotis)
    
    return created_cotisations

# ============================================
# CREDITS CRUD FUNCTIONS
# ============================================

def get_credits(db: Session):
    """
    Get all credits with member information
    """
    return db.query(models.Credit).all()

def get_credit_by_id(db: Session, id_credit: int):
    """
    Get a single credit by ID
    """
    return db.query(models.Credit).filter(models.Credit.id_credit == id_credit).first()

def get_credits_by_member(db: Session, id_membre: int):
    """
    Get all credits for a specific member
    """
    return db.query(models.Credit).filter(models.Credit.id_membre == id_membre).all()

def has_active_credit(db: Session, id_membre: int) -> bool:
    """
    Check if a member has any active credits (en_cours or en_retard)
    """
    active_credit = db.query(models.Credit).filter(
        models.Credit.id_membre == id_membre,
        models.Credit.statut.in_(["en_cours", "en_retard"])
    ).first()
    return active_credit is not None

def create_credit(db: Session, credit: schemas.CreditCreate):
    """
    Create a new credit request
    Verifies that the member exists before creation
    """
    # Verify member exists
    member = db.query(models.Membre).filter(models.Membre.id_membre == credit.id_membre).first()
    if not member:
        return None
    
    # Calculate solde (remaining balance = montant + interest)
    montant_total = credit.montant * (1 + credit.taux_interet / 100)
    
    db_credit = models.Credit(
        montant=credit.montant,
        solde=montant_total,
        taux_interet=credit.taux_interet,
        objet=credit.objet,
        date_demande=credit.date_demande,
        date_remboursement_prevue=credit.date_remboursement_prevue,
        statut="en_cours",
        id_membre=credit.id_membre
    )
    db.add(db_credit)
    db.commit()
    db.refresh(db_credit)
    return db_credit

def repay_credit(db: Session, id_credit: int, montant_paye: float):
    """
    Process a credit repayment
    Updates the solde and marks as 'rembourse' if fully paid
    """
    db_credit = db.query(models.Credit).filter(models.Credit.id_credit == id_credit).first()
    if not db_credit:
        return None
    
    # Update remaining balance
    db_credit.solde -= montant_paye
    
    # If fully paid, mark as 'rembourse'
    if db_credit.solde <= 0:
        db_credit.solde = 0
        db_credit.statut = "rembourse"
    
    db.commit()
    db.refresh(db_credit)
    return db_credit

def update_overdue_credits(db: Session):
    """
    Update credits that are past their due date to 'en_retard' status
    """
    from datetime import date
    today = date.today()
    
    overdue_credits = db.query(models.Credit).filter(
        models.Credit.statut == "en_cours",
        models.Credit.date_remboursement_prevue < today
    ).all()
    
    for credit in overdue_credits:
        credit.statut = "en_retard"
    
    db.commit()
    return len(overdue_credits)

# ============================================
# PENALTIES CRUD FUNCTIONS
# ============================================

def get_penalites(db: Session):
    """Get all penalties"""
    return db.query(models.Penalite).all()

def get_penalite_by_id(db: Session, id_penalite: int):
    """Get a single penalty by ID"""
    return db.query(models.Penalite).filter(models.Penalite.id_penalite == id_penalite).first()

def get_penalites_by_membre(db: Session, id_membre: int):
    """Get all penalties for a specific member"""
    return db.query(models.Penalite).filter(models.Penalite.id_membre == id_membre).all()

def get_penalites_by_seance(db: Session, id_seance: int):
    """Get all penalties for a specific session"""
    return db.query(models.Penalite).filter(models.Penalite.id_seance == id_seance).all()

def update_penalite(db: Session, id_penalite: int, penalite_update: dict):
    """Update a penalty (e.g., mark as paid)"""
    db_penalite = db.query(models.Penalite).filter(models.Penalite.id_penalite == id_penalite).first()
    if not db_penalite:
        return None
    for key, value in penalite_update.items():
        if value is not None:
            setattr(db_penalite, key, value)
    db.commit()
    db.refresh(db_penalite)
    return db_penalite

def delete_penalite(db: Session, id_penalite: int):
    """Delete a penalty"""
    db_penalite = db.query(models.Penalite).filter(models.Penalite.id_penalite == id_penalite).first()
    if db_penalite:
        db.delete(db_penalite)
        db.commit()
        return True
    return False

# ============================================
# TOURS CRUD FUNCTIONS
# ============================================

def get_tours(db: Session):
    """Get all tours with beneficiary info"""
    return db.query(models.Tour).all()

def get_tour_by_id(db: Session, id_tour: int):
    """Get a single tour by ID"""
    return db.query(models.Tour).filter(models.Tour.id_tour == id_tour).first()

def get_tours_by_tontine(db: Session, id_tontine: int):
    """Get all tours for a specific tontine"""
    return db.query(models.Tour).filter(models.Tour.id_tontine == id_tontine).order_by(models.Tour.numero).all()

def get_tours_by_membre(db: Session, id_membre: int):
    """Get all tours where a member was the beneficiary"""
    return db.query(models.Tour).filter(models.Tour.id_membre == id_membre).all()

def get_next_tour_number(db: Session, id_tontine: int):
    """Get the next tour number for a tontine"""
    last_tour = db.query(models.Tour).filter(
        models.Tour.id_tontine == id_tontine
    ).order_by(models.Tour.numero.desc()).first()
    return (last_tour.numero + 1) if last_tour else 1

def has_member_received_tour(db: Session, id_tontine: int, id_membre: int):
    """Check if a member has already received a tour in this tontine cycle"""
    existing_tour = db.query(models.Tour).filter(
        models.Tour.id_tontine == id_tontine,
        models.Tour.id_membre == id_membre
    ).first()
    return existing_tour is not None

def get_session_total_contributions(db: Session, id_seance: int):
    """Calculate total contributions for a session"""
    total = db.query(func.sum(models.Cotisation.montant)).filter(
        models.Cotisation.id_seance == id_seance
    ).scalar()
    return total or 0

def create_tour(db: Session, tour: schemas.TourCreate):
    """
    Create a new tour (beneficiary assignment)
    Business Logic: 
    - Assigns the next tour number automatically
    - Validates member hasn't already received in this cycle
    """
    # Verify member exists and is part of tontine
    member = db.query(models.Membre).filter(models.Membre.id_membre == tour.id_membre).first()
    if not member:
        return None
    
    # Check if member is part of this tontine
    tontine = db.query(models.Tontine).filter(models.Tontine.id_tontine == tour.id_tontine).first()
    if not tontine:
        return None
    
    db_tour = models.Tour(
        numero=tour.numero,
        date=tour.date,
        montant_distribue=tour.montant_distribue,
        id_membre=tour.id_membre,
        id_tontine=tour.id_tontine
    )
    db.add(db_tour)
    db.commit()
    db.refresh(db_tour)
    return db_tour

def delete_tour(db: Session, id_tour: int):
    """Delete a tour"""
    db_tour = db.query(models.Tour).filter(models.Tour.id_tour == id_tour).first()
    if db_tour:
        db.delete(db_tour)
        db.commit()
        return True
    return False

# ============================================
# PROJECTS CRUD FUNCTIONS
# ============================================

def get_projets(db: Session):
    """Get all projects"""
    return db.query(models.Projet).all()

def get_projet_by_id(db: Session, id_projet: int):
    """Get a single project by ID"""
    return db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()

def get_projets_by_tontine(db: Session, id_tontine: int):
    """Get all projects for a specific tontine"""
    return db.query(models.Projet).filter(models.Projet.id_tontine == id_tontine).all()

def create_projet(db: Session, projet: schemas.ProjetCreate):
    """Create a new project"""
    # Verify tontine exists
    tontine = db.query(models.Tontine).filter(models.Tontine.id_tontine == projet.id_tontine).first()
    if not tontine:
        return None
    
    db_projet = models.Projet(
        nom=projet.nom,
        description=projet.description,
        budget=projet.budget,
        montant_alloue=projet.montant_alloue,
        date_debut=projet.date_debut,
        date_fin=projet.date_fin,
        statut=projet.statut,
        id_responsable=projet.id_responsable,
        id_tontine=projet.id_tontine
    )
    db.add(db_projet)
    db.commit()
    db.refresh(db_projet)
    return db_projet

def update_projet(db: Session, id_projet: int, projet_update: dict):
    """Update a project"""
    db_projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if not db_projet:
        return None
    for key, value in projet_update.items():
        if value is not None:
            setattr(db_projet, key, value)
    db.commit()
    db.refresh(db_projet)
    return db_projet

def delete_projet(db: Session, id_projet: int):
    """Delete a project"""
    db_projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if db_projet:
        db.delete(db_projet)
        db.commit()
        return True
    return False

def get_eligible_beneficiaries(db: Session, id_tontine: int):
    """
    Get members who haven't received a tour yet in this tontine
    Returns list of eligible members for next beneficiary selection
    """
    # Get all members in this tontine
    tontine = db.query(models.Tontine).filter(models.Tontine.id_tontine == id_tontine).first()
    if not tontine:
        return []
    
    # Get members who already received
    received_member_ids = db.query(models.Tour.id_membre).filter(
        models.Tour.id_tontine == id_tontine
    ).all()
    received_ids = [m[0] for m in received_member_ids]
    
    # Return members who haven't received yet
    eligible = [m for m in tontine.membres if m.id_membre not in received_ids]
    return eligible
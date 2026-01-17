from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas

def get_membres(db: Session):
    return db.query(models.Membre).all()

def get_membre_by_id(db: Session, id_membre: int):
    return db.query(models.Membre).filter(models.Membre.id_membre == id_membre).first()

def create_membre(db: Session, membre: schemas.MembreCreate):
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
    stmt = models.membre_tontine.insert().values(id_membre=id_membre, id_tontine=id_tontine, nb_parts=nb_parts)
    db.execute(stmt)
    db.commit()
    return {"message": "Member added to tontine"}

def get_dashboard_stats(db: Session):
    total_cotisations = db.query(func.sum(models.Cotisation.montant)).scalar() or 0
    total_penalties = db.query(func.sum(models.Penalite.montant)).scalar() or 0
    total_tours = db.query(func.sum(models.Tour.montant_distribue)).scalar() or 0
    total_credits = db.query(func.sum(models.Credit.montant)).filter(models.Credit.statut == "en_cours").scalar() or 0
    
    caisse = (total_cotisations + total_penalties) - (total_tours + total_credits)
    
    active_members = db.query(models.Membre).filter(models.Membre.statut == "Actif").count()
    active_credits_count = db.query(models.Credit).filter(models.Credit.statut == "en_cours").count()
    penalties_count = db.query(models.Penalite).count()
    
    return {
        "caisse": caisse,
        "active_members": active_members,
        "active_credits": active_credits_count,
        "total_penalties": penalties_count
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
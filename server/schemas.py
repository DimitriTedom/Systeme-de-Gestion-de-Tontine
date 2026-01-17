from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class MembreBase(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: str
    adresse: Optional[str] = None
    commune: Optional[str] = None
    statut: str = "Actif"

class MembreCreate(MembreBase):
    date_inscription: date

class Membre(MembreBase):
    id_membre: int
    class Config:
        from_attributes = True

class TontineBase(BaseModel):
    type: str
    montant_cotisation: float
    periode: str
    description: Optional[str] = None
    date_debut: date
    statut: str = "Actif"

class TontineCreate(TontineBase):
    pass

class Tontine(TontineBase):
    id_tontine: int
    membres_count: Optional[int] = 0
    class Config:
        from_attributes = True

class SeanceCreate(BaseModel):
    date: date
    lieu: str
    statut: str
    id_tontine: int
    notes: Optional[str] = None

class Seance(BaseModel):
    id_seance: int
    date: date
    lieu: str
    statut: str
    id_tontine: int
    notes: Optional[str] = None
    class Config:
        from_attributes = True

class CreditCreate(BaseModel):
    montant: float
    taux_interet: float
    objet: str
    date_demande: date
    date_remboursement_prevue: date
    id_membre: int

class TourCreate(BaseModel):
    numero: int
    date: date
    montant_distribue: float
    id_membre: int
    id_tontine: int

class DashboardStats(BaseModel):
    caisse: float
    active_members: int
    active_credits: int
    total_penalties: int
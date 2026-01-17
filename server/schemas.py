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

# Schema for registering a member to a tontine
class RegisterToTontineRequest(BaseModel):
    id_tontine: int
    nb_parts: int = 1

# Schema for member's tontine participation
class MemberTontineParticipation(BaseModel):
    id_tontine: int
    type: str
    montant_cotisation: float
    periode: str
    description: Optional[str] = None
    date_debut: date
    date_fin: Optional[date] = None
    statut: str
    nb_parts: int
    class Config:
        from_attributes = True

# Schema for tontine's member participation
class TontineMemberParticipation(BaseModel):
    id_membre: int
    nom: str
    prenom: str
    email: str
    telephone: str
    statut: str
    nb_parts: int
    class Config:
        from_attributes = True

class TontineBase(BaseModel):
    type: str
    montant_cotisation: float
    periode: str
    description: Optional[str] = None
    date_debut: date
    date_fin: Optional[date] = None
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

class Credit(BaseModel):
    id_credit: int
    montant: float
    solde: float
    taux_interet: float
    objet: str
    date_demande: date
    date_remboursement_prevue: date
    statut: str
    id_membre: int
    class Config:
        from_attributes = True

class CreditRepayment(BaseModel):
    montant_paye: float

class TourCreate(BaseModel):
    numero: int
    date: date
    montant_distribue: float
    id_membre: int
    id_tontine: int
    id_seance: Optional[int] = None

class DashboardStats(BaseModel):
    caisse: float
    active_members: int
    active_credits: int
    pending_penalties: int
    total_penalties_unpaid: float
    active_projects: int
    total_contributions: float
    total_tours: float

class CotisationCreate(BaseModel):
    montant: float
    date_paiement: date
    id_membre: int
    id_seance: int

class Cotisation(BaseModel):
    id_cotisation: int
    montant: float
    date_paiement: date
    id_membre: int
    id_seance: int
    class Config:
        from_attributes = True

class PenaliteCreate(BaseModel):
    montant: float
    raison: str
    date: date
    id_membre: int
    id_seance: Optional[int] = None
    id_tontine: Optional[int] = None
    type_penalite: Optional[str] = None
    statut: str = "non_paye"

class Penalite(BaseModel):
    id_penalite: int
    montant: float
    raison: str
    date: date
    statut: str
    type_penalite: Optional[str] = None
    id_membre: int
    id_seance: Optional[int] = None
    id_tontine: Optional[int] = None
    class Config:
        from_attributes = True

class PenaliteUpdate(BaseModel):
    statut: Optional[str] = None
    montant: Optional[float] = None

# ============================================
# TOUR SCHEMAS
# ============================================

class Tour(BaseModel):
    id_tour: int
    numero: int
    date: date
    montant_distribue: float
    id_membre: int
    id_tontine: int
    id_seance: Optional[int] = None
    # Include member info for display
    beneficiaire_nom: Optional[str] = None
    beneficiaire_prenom: Optional[str] = None
    class Config:
        from_attributes = True

# ============================================
# PROJECT SCHEMAS  
# ============================================

class ProjetCreate(BaseModel):
    nom: str
    description: Optional[str] = None
    budget: float
    montant_alloue: float = 0
    date_debut: date
    date_fin: Optional[date] = None
    statut: str = "en_cours"
    id_responsable: Optional[int] = None
    id_tontine: int

class Projet(BaseModel):
    id_projet: int
    nom: str
    description: Optional[str] = None
    budget: float
    montant_alloue: float
    date_debut: date
    date_fin: Optional[date] = None
    statut: str
    id_responsable: Optional[int] = None
    id_tontine: int
    class Config:
        from_attributes = True

class ProjetUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    montant_alloue: Optional[float] = None
    date_fin: Optional[date] = None
    statut: Optional[str] = None

class BulkCotisationCreate(BaseModel):
    cotisations: List[CotisationCreate]

class AttendanceRecord(BaseModel):
    id_membre: int
    present: bool
    montant: Optional[float] = None

class CloseSessionRequest(BaseModel):
    attendance: List[AttendanceRecord]
    montant_penalite_absence: float = 5000.0

class PenaltySummary(BaseModel):
    id_membre: int
    nom: str
    prenom: str
    montant: float
    raison: str

class CloseSessionResponse(BaseModel):
    id_seance: int
    statut: str
    penalties_created: List[PenaltySummary]
    total_contributions: float
    total_penalties: float

# Schema for session attendance (members with expected contribution)
class SessionAttendanceMember(BaseModel):
    id_membre: int
    nom: str
    prenom: str
    email: str
    telephone: str
    nb_parts: int
    expected_contribution: float
    statut: str
    class Config:
        from_attributes = True
    total_penalties: int
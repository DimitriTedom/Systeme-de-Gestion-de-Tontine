from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Table, Enum, Text
from sqlalchemy.orm import relationship
from database import Base

# Association Table for Membre <-> Tontine (Many-to-Many)
membre_tontine = Table(
    "membre_tontine",
    Base.metadata,
    Column("id_membre", Integer, ForeignKey("membres.id_membre"), primary_key=True),
    Column("id_tontine", Integer, ForeignKey("tontines.id_tontine"), primary_key=True),
    Column("nb_parts", Integer, default=1)
)

# Association Table for Projet <-> Participants (Many-to-Many)
projet_participants = Table(
    "projet_participants",
    Base.metadata,
    Column("id_projet", Integer, ForeignKey("projets.id_projet"), primary_key=True),
    Column("id_membre", Integer, ForeignKey("membres.id_membre"), primary_key=True)
)

class Membre(Base):
    __tablename__ = "membres"
    id_membre = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100))
    prenom = Column(String(100))
    telephone = Column(String(20))
    email = Column(String(100), unique=True)
    adresse = Column(String(255))
    commune = Column(String(100))
    statut = Column(String(20), default="Actif")
    date_inscription = Column(Date)

    cotisations = relationship("Cotisation", back_populates="membre")
    penalites = relationship("Penalite", back_populates="membre")
    credits = relationship("Credit", back_populates="membre")
    tours = relationship("Tour", back_populates="beneficiaire")
    tontines = relationship("Tontine", secondary=membre_tontine, back_populates="membres")
    projets_participes = relationship("Projet", secondary=projet_participants, back_populates="participants")

class Tontine(Base):
    __tablename__ = "tontines"
    id_tontine = Column(Integer, primary_key=True, index=True)
    type = Column(String(50)) # presence / optionnelle
    montant_cotisation = Column(Float)
    periode = Column(String(50)) # mensuelle / hebdomadaire
    description = Column(Text)
    date_debut = Column(Date)
    date_fin = Column(Date, nullable=True)
    statut = Column(String(20), default="Actif")

    seances = relationship("Seance", back_populates="tontine")
    tours = relationship("Tour", back_populates="tontine")
    membres = relationship("Membre", secondary=membre_tontine, back_populates="tontines")
    projets = relationship("Projet", back_populates="tontine_financeuse")

class Seance(Base):
    __tablename__ = "seances"
    id_seance = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    lieu = Column(String(255))
    statut = Column(String(50)) # tenue / annulee / programmee / cloturee
    notes = Column(Text)
    id_tontine = Column(Integer, ForeignKey("tontines.id_tontine"))

    tontine = relationship("Tontine", back_populates="seances")
    cotisations = relationship("Cotisation", back_populates="seance")
    penalites = relationship("Penalite", back_populates="seance")

class Cotisation(Base):
    __tablename__ = "cotisations"
    id_cotisation = Column(Integer, primary_key=True, index=True)
    montant = Column(Float)
    date_paiement = Column(Date)
    id_membre = Column(Integer, ForeignKey("membres.id_membre"))
    id_seance = Column(Integer, ForeignKey("seances.id_seance"))

    membre = relationship("Membre", back_populates="cotisations")
    seance = relationship("Seance", back_populates="cotisations")

class Credit(Base):
    __tablename__ = "credits"
    id_credit = Column(Integer, primary_key=True, index=True)
    montant = Column(Float)
    solde = Column(Float)
    taux_interet = Column(Float)
    objet = Column(String(255))
    date_demande = Column(Date)
    date_remboursement_prevue = Column(Date)
    statut = Column(String(50)) # en_cours / rembourse / en_retard
    id_membre = Column(Integer, ForeignKey("membres.id_membre"))

    membre = relationship("Membre", back_populates="credits")

class Penalite(Base):
    __tablename__ = "penalites"
    id_penalite = Column(Integer, primary_key=True, index=True)
    montant = Column(Float)
    raison = Column(String(255))
    date = Column(Date)
    statut = Column(String(50), default="non_paye")  # non_paye / paye / annule
    type_penalite = Column(String(50), nullable=True)  # absence / late_contribution / misconduct / other
    id_membre = Column(Integer, ForeignKey("membres.id_membre"))
    id_seance = Column(Integer, ForeignKey("seances.id_seance"), nullable=True)
    id_tontine = Column(Integer, ForeignKey("tontines.id_tontine"), nullable=True)

    membre = relationship("Membre", back_populates="penalites")
    seance = relationship("Seance")
    tontine = relationship("Tontine")

class Tour(Base):
    __tablename__ = "tours"
    id_tour = Column(Integer, primary_key=True, index=True)
    numero = Column(Integer)
    date = Column(Date)
    montant_distribue = Column(Float)
    id_membre = Column(Integer, ForeignKey("membres.id_membre"))
    id_tontine = Column(Integer, ForeignKey("tontines.id_tontine"))
    id_seance = Column(Integer, ForeignKey("seances.id_seance"), nullable=True)

    beneficiaire = relationship("Membre", back_populates="tours")
    tontine = relationship("Tontine", back_populates="tours")
    seance = relationship("Seance")

class Projet(Base):
    __tablename__ = "projets"
    id_projet = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100))
    description = Column(Text)
    budget = Column(Float)
    montant_alloue = Column(Float)
    date_debut = Column(Date)
    date_fin = Column(Date)
    statut = Column(String(50)) # en_cours / termine
    id_responsable = Column(Integer, ForeignKey("membres.id_membre"))
    id_tontine = Column(Integer, ForeignKey("tontines.id_tontine"))

    tontine_financeuse = relationship("Tontine", back_populates="projets")
    participants = relationship("Membre", secondary=projet_participants, back_populates="projets_participes")
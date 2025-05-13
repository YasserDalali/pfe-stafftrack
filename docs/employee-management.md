### Nom de la fonctionnalité & But
**Gestion des employés pour l'administration du personnel et intégration avec les modules**

---

## Manuel d'utilisation

1. **Prérequis** :
   - Accès à l'application (interface administrateur)
   - Compte Supabase configuré (variables `.env`)
   - Droits d'administration sur la gestion du personnel

2. **Démarrage** :
   - Accéder à la page "Employees" depuis le menu administrateur
   - Visualiser la liste des employés existants (tableau avec filtre, tri)
   - Utiliser le bouton "Add Employee" pour créer un nouvel employé
   - Cliquer sur un nom pour accéder à la page détaillée du profil

3. **Flux utilisateur** :
   - **Ajout d'un employé** :
     - Cliquer sur "Add Employee"
     - Remplir le formulaire (nom, email, poste, date d'embauche, etc.)
     - Télécharger une photo de profil (utilisée pour la détection faciale)
     - Soumettre le formulaire
   - **Modification d'un employé** :
     - Cliquer sur l'icône d'édition dans la liste
     - Modifier les informations dans le formulaire
     - Soumettre les changements
   - **Suppression d'un employé** :
     - Cliquer sur l'icône de suppression
     - Confirmer la suppression (attention : impact sur les données liées)
   - **Consultation du profil détaillé** :
     - Historique de présence
     - Historique des congés
     - Statistiques personnelles

---

## Diagramme UML de Class/Séquence (PlantUML)

```plantuml
@startuml
class Employee {
  +id: number
  +name: string
  +email: string
  +position: string
  +department: string
  +hire_date: date
  +monthly_salary: decimal
  +weekly_work_hours: number
  +leave_balance: number
  +avatar_url: string
  +avatar_descriptor: JSON
  +created_at: timestamp
  +updated_at: timestamp
}

class Attendance {
  +id: number
  +employee_id: number FK
  +checkdate: timestamp
  +status: enum
  +lateness: interval
  +confidence_score: decimal
}

class Leave {
  +id: number
  +employee_id: number FK
  +type: string
  +status: enum
  +start_date: date
  +end_date: date
  +duration: number
  +reason: string
  +created_at: timestamp
}

Employee "1" -- "0..*" Attendance: génère >
Employee "1" -- "0..*" Leave: demande >

@enduml
```

```plantuml
@startuml
actor Utilisateur
participant EmployeePage
participant AddEmployeeModal
participant EditEmployeeModal
participant EmployeeTable
participant ProfilePage
participant Supabase
participant "FaceDetection" as FaceDetection
participant "AttendancePage" as Attendance
participant "LeaveManagement" as LeaveManagement

Utilisateur -> EmployeePage: Accède à la page
EmployeePage -> Supabase: useFetchEmployees()
Supabase --> EmployeePage: Liste des employés
EmployeePage -> EmployeeTable: Affiche tableau
EmployeeTable --> Utilisateur: Visualise employés

alt Ajout d'un employé
    Utilisateur -> EmployeePage: Clique sur "Add Employee"
    EmployeePage -> AddEmployeeModal: Ouvre le formulaire
    Utilisateur -> AddEmployeeModal: Remplit les champs
    Utilisateur -> AddEmployeeModal: Télécharge photo
    AddEmployeeModal -> Supabase: Stocke l'image dans bucket
    alt Si la détection faciale est activée
        AddEmployeeModal -> FaceDetection: Génère descripteur facial
        FaceDetection --> AddEmployeeModal: Descripteur JSON
        AddEmployeeModal -> Supabase: Stocke descripteur
    end
    AddEmployeeModal -> Supabase: Insère nouvel employé
    Supabase --> AddEmployeeModal: Confirmation
    AddEmployeeModal --> EmployeePage: Ferme le modal et rafraîchit
    EmployeePage -> Supabase: Récupère liste mise à jour
    Supabase --> EmployeePage: Données actualisées
    EmployeePage --> Utilisateur: Affiche tableau avec nouvel employé
end

alt Édition d'un employé
    Utilisateur -> EmployeeTable: Clique sur icône d'édition
    EmployeeTable -> EmployeePage: handleEditClick(employee)
    EmployeePage -> EditEmployeeModal: Ouvre modal avec données
    Utilisateur -> EditEmployeeModal: Modifie les informations
    EditEmployeeModal -> Supabase: Mise à jour employé
    Supabase --> EditEmployeeModal: Confirmation
    EditEmployeeModal --> EmployeePage: Ferme et rafraîchit
end

alt Suppression d'un employé
    Utilisateur -> EmployeeTable: Clique sur icône de suppression
    EmployeeTable -> EmployeePage: handleDeleteClick(id)
    EmployeePage -> Utilisateur: Demande confirmation
    Utilisateur -> EmployeePage: Confirme suppression
    EmployeePage -> Supabase: Supprime l'employé
    Supabase --> EmployeePage: Confirmation
    EmployeePage -> EmployeeTable: Actualise tableau
    EmployeeTable --> Utilisateur: Affiche liste mise à jour
end

alt Consultation profil détaillé
    Utilisateur -> EmployeeTable: Clique sur nom d'employé
    EmployeeTable -> ProfilePage: Redirige vers /employees/:id
    ProfilePage -> Supabase: Récupère détails employé
    ProfilePage -> Supabase: Récupère historique présence
    ProfilePage -> Supabase: Récupère historique congés
    Supabase --> ProfilePage: Données complètes
    ProfilePage --> Utilisateur: Affiche profil détaillé
end

note right of FaceDetection
  Les descripteurs faciaux sont utilisés pour 
  la reconnaissance automatique des employés
end note

note right of Attendance
  Les employés sont référencés lors de
  l'enregistrement des présences
end note

note right of LeaveManagement
  Les demandes de congés sont
  associées aux employés
end note
@enduml
```

---

## Explication détaillée de la logique

### 1. Structure des données employés
- **Informations de base** :
  - Identifiants (id, nom, email)
  - Informations professionnelles (poste, département, date d'embauche)
  - Données contractuelles (salaire, heures hebdomadaires)
  - Solde de congés (leave_balance)
  - Avatar et descripteur facial pour la reconnaissance

- **Table Supabase** :
  - Table `employees` (voir database.md)
  - Relations vers `attendance` et `leaves` (clés étrangères)
  - Stockage des photos dans Supabase Storage (bucket)
  - Descripteurs faciaux stockés en JSON pour la reconnaissance

### 2. Flux d'ajout/modification des employés
- **Formulaire d'ajout** :
  - Composant `AddEmployeeModal` avec validation des champs
  - Upload d'image avec prévisualisation
  - Génération optionnelle du descripteur facial à l'enregistrement
  - Insertion dans Supabase avec gestion d'erreur

- **Formulaire d'édition** :
  - Composant `EditEmployeeModal` pré-rempli avec les données existantes
  - Support pour la modification de l'avatar
  - Mise à jour du descripteur facial si l'image change
  - Transaction Supabase pour mise à jour atomique

- **Suppression** :
  - Vérification des dépendances (présences, congés)
  - Confirmation utilisateur avec avertissement
  - Suppression Supabase avec cascade ou blocage selon la configuration

### 3. Visualisation des employés
- **Tableau interactif** :
  - Composant `EmployeeTable` avec tri, filtre, pagination
  - Rendu optimisé avec animations de transition
  - Actions contextuelles (éditer, supprimer, voir profil)
  - Indicateurs visuels (avatars, statuts)

- **Profil détaillé** :
  - Page `ProfilePage` avec tous les détails d'un employé
  - Historique de présence et statistiques (ponctualité, taux de présence)
  - Historique et statut des demandes de congés
  - Graphiques de performance et d'assiduité

### 4. Intégration avec d'autres modules
- **Détection faciale** :
  - Utilisation des descripteurs faciaux pour la reconnaissance
  - Création automatique des descripteurs lors de l'ajout/modification
  - Lien avec le module de détection pour l'enregistrement des présences

- **Gestion des présences** :
  - Référencement des employés lors des pointages
  - Visualisation des statistiques de présence sur le profil
  - Impact des paramètres de retard configurés

- **Gestion des congés** :
  - Association des demandes de congés aux employés
  - Vérification des soldes disponibles
  - Historique et statut des demandes sur le profil

- **Dashboard** :
  - Alimentation des graphiques de présence, satisfaction, coûts
  - Métriques RH basées sur les données employés
  - Statistiques départementales et par équipe

---

## Configuration & Setup

- **Variables d'environnement** :
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Structure Supabase** :
  - Table `employees` (voir database.md)
  - Bucket Storage pour les avatars
  - Relations RLS (Row Level Security) pour la sécurité
- **Routes d'accès** :
  - `/admin/employees` : Liste des employés
  - `/admin/employees/:id` : Profil détaillé

---

## Exemples d'utilisation avancés

```js
// Hook personnalisé pour la gestion des employés
import { useState, useEffect, useCallback } from 'react';
import supabase from '../database/supabase-client';
import { extractFaceDescriptorFromImage } from '../utils/faceDetectionUtils';

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupération des employés
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ajout d'un employé avec traitement d'avatar et descripteur facial
  const addEmployee = async (employeeData, avatarFile) => {
    try {
      // 1. Upload de l'avatar si fourni
      let avatarUrl = null;
      let descriptorJSON = null;

      if (avatarFile) {
        // Génération d'un nom de fichier unique
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee-avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        // Récupération de l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('employee-avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = publicUrl;

        // 2. Extraction du descripteur facial
        try {
          const descriptor = await extractFaceDescriptorFromImage(avatarUrl);
          if (descriptor) {
            descriptorJSON = JSON.stringify(Array.from(descriptor));
          }
        } catch (descriptorError) {
          console.warn('Could not extract face descriptor:', descriptorError);
          // On continue même sans descripteur
        }
      }

      // 3. Insertion de l'employé avec les données complètes
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          ...employeeData,
          avatar_url: avatarUrl,
          avatar_descriptor: descriptorJSON,
          created_at: new Date()
        }])
        .select();

      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error adding employee:', err);
      return { success: false, error: err.message };
    }
  };

  // Suppression d'un employé et ses références
  const deleteEmployee = async (employeeId) => {
    try {
      // 1. Récupération de l'URL de l'avatar pour suppression ultérieure
      const { data: employeeData } = await supabase
        .from('employees')
        .select('avatar_url')
        .eq('id', employeeId)
        .single();

      // 2. Suppression des enregistrements liés (si pas de contraintes FK)
      await supabase.from('attendance').delete().eq('employee_id', employeeId);
      await supabase.from('leaves').delete().eq('employee_id', employeeId);

      // 3. Suppression de l'employé
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      // 4. Suppression de l'avatar si présent
      if (employeeData?.avatar_url) {
        const avatarPath = employeeData.avatar_url.split('/').pop();
        await supabase.storage
          .from('employee-avatars')
          .remove([`avatars/${avatarPath}`]);
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting employee:', err);
      return { success: false, error: err.message };
    }
  };

  // Initialisation
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    addEmployee,
    deleteEmployee
  };
};
```

---

## Liens & Références

- [Supabase documentation](https://supabase.com/docs)
- [React Table](https://react-table.tanstack.com/)
- [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- Fichiers sources :
  - `src/pages/EmployeePage.jsx`
  - `src/components/EmployeeTable.jsx`
  - `src/components/AddEmployeeModal.jsx`
  - `src/pages/ProfilePage.jsx` 
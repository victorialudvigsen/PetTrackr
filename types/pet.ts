export interface PetData {
  id: string; // Firestore doc-id
  name: string;
  type: string;
  photoUrl?: string; // downloadUrl fra Firebase Storage (valgfri)
}

import torch
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem
import json
import sys
from gnnModel import get_placeholder_model

class GNNPredictor:
    def __init__(self):
        self.model = get_placeholder_model()
        
    def smiles_to_graph(self, smiles):
        """
        Converts SMILES to a graph representation:
        - Node features: [N, 16] (atomic num, degree, hybrid, aromatic, etc.)
        - Adjacency matrix: [N, N]
        """
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            return None
            
        num_atoms = mol.GetNumAtoms()
        
        # 1. Feature Extraction (Node features)
        node_features = []
        for atom in mol.GetAtoms():
            features = [
                atom.GetAtomicNum() / 100.0, # Normalized atomic number
                atom.GetDegree() / 5.0,
                atom.GetTotalNumHs() / 4.0,
                atom.GetImplicitValence() / 5.0,
                1.0 if atom.GetIsAromatic() else 0.0,
                1.0 if atom.IsInRing() else 0.0,
                atom.GetFormalCharge() / 5.0,
                # Simple hybridizations (SP, SP2, SP3, etc)
                1.0 if atom.GetHybridization() == Chem.HybridizationType.SP else 0.0,
                1.0 if atom.GetHybridization() == Chem.HybridizationType.SP2 else 0.0,
                1.0 if atom.GetHybridization() == Chem.HybridizationType.SP3 else 0.0,
                # Padding to 16 features
                0, 0, 0, 0, 0, 0
            ]
            node_features.append(features)
            
        x = torch.tensor(node_features, dtype=torch.float)
        
        # 2. Adjacency Matrix
        adj = torch.zeros((num_atoms, num_atoms))
        for bond in mol.GetBonds():
            i = bond.GetBeginAtomIdx()
            j = bond.GetEndAtomIdx()
            
            # Weight adjacency by bond type
            bond_type = bond.GetBondTypeAsDouble()
            adj[i, j] = bond_type
            adj[j, i] = bond_type
            
        # Add self-loops
        adj += torch.eye(num_atoms)
        
        return x, adj, num_atoms

    def predict(self, smiles):
        """Perform GNN inference on a SMILES string"""
        try:
            graph_data = self.smiles_to_graph(smiles)
            if not graph_data:
                return {"error": "Invalid SMILES"}
                
            x, adj, num_atoms = graph_data
            
            with torch.no_grad():
                atom_scores, molecule_score = self.model(x, adj)
                
            # Convert to list for JSON serialization
            atom_scores_list = atom_scores.flatten().tolist()
            
            # Map scores back to atom symbols and indices
            mol = Chem.MolFromSmiles(smiles)
            atom_details = []
            for i, atom in enumerate(mol.GetAtoms()):
                atom_details.append({
                    "index": i,
                    "symbol": atom.GetSymbol(),
                    "lability": round(atom_scores_list[i], 3)
                })
                
            return {
                "success": True,
                "overall_susceptibility": round(molecule_score.item() * 100, 2),
                "atom_lability": atom_details,
                "num_atoms": num_atoms,
                "model_type": "GNN-v1 (Graph Convolutional Network)"
            }
        except Exception as e:
            return {"error": str(e)}

if __name__ == "__main__":
    # Test block
    predictor = GNNPredictor()
    test_smiles = sys.argv[1] if len(sys.argv) > 1 else "CC(=O)Oc1ccccc1C(=O)O"
    result = predictor.predict(test_smiles)
    print(json.dumps(result, indent=2))

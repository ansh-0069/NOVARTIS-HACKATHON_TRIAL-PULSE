import torch
import torch.nn as nn
import torch.nn.functional as F

class GraphConvolution(nn.Module):
    """
    Simulated Graph Convolutional Layer for Molecular Graphs
    """
    def __init__(self, in_features, out_features):
        super(GraphConvolution, self).__init__()
        self.projection = nn.Linear(in_features, out_features)
        self.message_fn = nn.Linear(in_features, out_features)

    def forward(self, x, adj):
        """
        x: [N, in_features] - Node features
        adj: [N, N] - Adjacency matrix (weighted by bond types or normalized)
        """
        # Node projection
        h = self.projection(x)
        
        # Message passing: A * X
        m = torch.matmul(adj, h)
        
        return F.relu(m)

class MolecularGNN(nn.Module):
    """
    Molecular GNN for Lability Prediction
    Predicts a 'Lability Score' for each atom in the molecule
    """
    def __init__(self, input_dim=16, hidden_dim=32, output_dim=1):
        super(MolecularGNN, self).__init__()
        
        # GCN Layers
        self.conv1 = GraphConvolution(input_dim, hidden_dim)
        self.conv2 = GraphConvolution(hidden_dim, hidden_dim)
        
        # Readiness/Lability Readout per atom
        self.atom_lability = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, output_dim),
            nn.Sigmoid()
        )
        
        # Global Pooling for whole-molecule score
        self.molecule_score = nn.Linear(hidden_dim, 1)

    def forward(self, x, adj):
        """
        x: [N, features]
        adj: [N, N]
        """
        # GNN Propagation
        h = self.conv1(x, adj)
        h = self.conv2(h, adj)
        
        # Atom-level lability scores
        atom_scores = self.atom_lability(h) # [N, 1]
        
        # Global molecule susceptibility (max-pooling across atoms)
        # In a real GNN, we might use global_max_pool
        molecule_rep = torch.max(h, dim=0)[0]
        molecule_score = torch.sigmoid(self.molecule_score(molecule_rep))
        
        return atom_scores, molecule_score

def get_placeholder_model():
    """Returns an initialized model with random weights for inference demo"""
    model = MolecularGNN()
    model.eval()
    return model

if __name__ == "__main__":
    # Test pass with dummy data
    print("Testing GNN Architecture...")
    model = MolecularGNN()
    
    # 5 atoms, 16 features each
    dummy_x = torch.randn(5, 16)
    # Fully connected dummy adjacency for testing
    dummy_adj = torch.ones(5, 5)
    
    atom_scores, mol_score = model(dummy_x, dummy_adj)
    print(f"Node Scores Shape: {atom_scores.shape}")
    print(f"Molecule Score: {mol_score.item():.4f}")
    print("GNN Model successfully initialized.")

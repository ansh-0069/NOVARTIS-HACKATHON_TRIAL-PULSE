"""
Molecular Feature Extraction for Degradation Prediction
Uses RDKit for molecular descriptors and fingerprints
"""

from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors, AllChem
from rdkit.Chem import Lipinski, Crippen
import numpy as np
import json

class MolecularFeatureExtractor:
    def __init__(self):
        self.feature_names = []
    
    def smiles_to_mol(self, smiles):
        """Convert SMILES string to RDKit molecule"""
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError(f"Invalid SMILES: {smiles}")
        return mol
    
    def calculate_descriptors(self, smiles):
        """
        Calculate molecular descriptors for degradation prediction
        
        Features:
        - Physical: MW, LogP, TPSA, Rotatable bonds
        - Chemical: H-bond donors/acceptors, aromatic rings
        - Stability: Sp3 carbons, heteroatoms
        - Reactive sites: Nitrogens, oxygens, halogens
        """
        
        mol = self.smiles_to_mol(smiles)
        
        descriptors = {
            # Basic properties
            'molecular_weight': Descriptors.MolWt(mol),
            'logp': Crippen.MolLogP(mol),
            'tpsa': Descriptors.TPSA(mol),
            
            # Structural features
            'num_rotatable_bonds': Lipinski.NumRotatableBonds(mol),
            'num_aromatic_rings': rdMolDescriptors.CalcNumAromaticRings(mol),
            'num_aliphatic_rings': rdMolDescriptors.CalcNumAliphaticRings(mol),
            'num_saturated_rings': rdMolDescriptors.CalcNumSaturatedRings(mol),
            
            # Hydrogen bonding
            'num_h_donors': Lipinski.NumHDonors(mol),
            'num_h_acceptors': Lipinski.NumHAcceptors(mol),
            
            # Chemical composition
            'num_heavy_atoms': Lipinski.HeavyAtomCount(mol),
            'num_heteroatoms': rdMolDescriptors.CalcNumHeteroatoms(mol),
            'num_sp3_carbons': rdMolDescriptors.CalcNumAliphaticCarbocycles(mol),
            
            # Reactive functional groups
            'num_nitrogens': sum(1 for atom in mol.GetAtoms() if atom.GetAtomicNum() == 7),
            'num_oxygens': sum(1 for atom in mol.GetAtoms() if atom.GetAtomicNum() == 8),
            'num_sulfurs': sum(1 for atom in mol.GetAtoms() if atom.GetAtomicNum() == 16),
            'num_halogens': sum(1 for atom in mol.GetAtoms() if atom.GetAtomicNum() in [9, 17, 35, 53]),
            
            # Stability indicators
            'fraction_sp3': rdMolDescriptors.CalcFractionCSP3(mol),
            'aromatic_proportion': rdMolDescriptors.CalcNumAromaticRings(mol) / max(1, rdMolDescriptors.CalcNumRings(mol)) if rdMolDescriptors.CalcNumRings(mol) > 0 else 0,
            
            # Complexity
            'num_rings': rdMolDescriptors.CalcNumRings(mol),
            'num_bridgehead_atoms': rdMolDescriptors.CalcNumBridgeheadAtoms(mol),
            'num_spiro_atoms': rdMolDescriptors.CalcNumSpiroAtoms(mol),
        }
        
        return descriptors
    
    def calculate_fingerprint(self, smiles, radius=2, n_bits=2048):
        """
        Calculate Morgan (circular) fingerprint
        Used for similarity searches and ML input
        """
        mol = self.smiles_to_mol(smiles)
        fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius, nBits=n_bits)
        return np.array(fp)
    
    def identify_reactive_sites(self, smiles):
        """
        Identify potential reactive sites for degradation
        
        Returns sites prone to:
        - Hydrolysis (esters, amides, lactones)
        - Oxidation (alcohols, amines, sulfides)
        - Photolysis (aromatic rings, conjugated systems)
        """
        
        mol = self.smiles_to_mol(smiles)
        
        # SMARTS patterns for reactive groups
        reactive_patterns = {
            'ester': Chem.MolFromSmarts('C(=O)O'),
            'amide': Chem.MolFromSmarts('C(=O)N'),
            'lactone': Chem.MolFromSmarts('C1OC(=O)C1'),
            'lactam': Chem.MolFromSmarts('C1NC(=O)C1'),
            'secondary_alcohol': Chem.MolFromSmarts('[CH](O)'),
            'primary_amine': Chem.MolFromSmarts('[CH2]N'),
            'secondary_amine': Chem.MolFromSmarts('[CH]N'),
            'thioether': Chem.MolFromSmarts('CSC'),
            'phenol': Chem.MolFromSmarts('c[OH]'),
            'aromatic_amine': Chem.MolFromSmarts('cN'),
            'enone': Chem.MolFromSmarts('C=CC=O'),
            'aldehyde': Chem.MolFromSmarts('[CH]=O'),
            'ketone': Chem.MolFromSmarts('CC(=O)C'),
        }
        
        reactive_sites = {}
        
        for site_name, pattern in reactive_patterns.items():
            matches = mol.GetSubstructMatches(pattern)
            reactive_sites[site_name] = {
                'count': len(matches),
                'atom_indices': [list(match) for match in matches] if matches else []
            }
        
        return reactive_sites
    
    def predict_degradation_susceptibility(self, smiles, stress_type):
        """
        Predict degradation susceptibility based on structure and stress type
        
        Args:
            smiles: Molecule SMILES
            stress_type: 'acid', 'base', 'oxidative', 'thermal', 'photolytic'
        
        Returns:
            Susceptibility score (0-100) and reasoning
        """
        
        descriptors = self.calculate_descriptors(smiles)
        reactive_sites = self.identify_reactive_sites(smiles)
        
        # Rule-based scoring by stress type
        
        if stress_type == 'acid':
            # Acid stress targets: amides, lactams, glycosides, imines
            score = 0
            reasons = []
            
            if reactive_sites['amide']['count'] > 0:
                score += 25 * min(reactive_sites['amide']['count'], 3)
                reasons.append(f"{reactive_sites['amide']['count']} amide bond(s) - acid labile")
            
            if reactive_sites['lactam']['count'] > 0:
                score += 20 * reactive_sites['lactam']['count']
                reasons.append(f"{reactive_sites['lactam']['count']} lactam(s) - prone to ring opening")
            
            if reactive_sites['ester']['count'] > 0:
                score += 15 * min(reactive_sites['ester']['count'], 2)
                reasons.append(f"{reactive_sites['ester']['count']} ester(s) - acid hydrolysis")
            
            # Basicity increases acid stability
            if descriptors['num_nitrogens'] > 0:
                score -= 10
                reasons.append("Basic nitrogens - somewhat protective")
        
        elif stress_type == 'base':
            # Base stress targets: esters, lactones, amides (slower)
            score = 0
            reasons = []
            
            if reactive_sites['ester']['count'] > 0:
                score += 35 * min(reactive_sites['ester']['count'], 3)
                reasons.append(f"{reactive_sites['ester']['count']} ester(s) - base hydrolysis")
            
            if reactive_sites['lactone']['count'] > 0:
                score += 30 * reactive_sites['lactone']['count']
                reasons.append(f"{reactive_sites['lactone']['count']} lactone(s) - base-catalyzed opening")
            
            if reactive_sites['phenol']['count'] > 0:
                score += 10 * reactive_sites['phenol']['count']
                reasons.append(f"{reactive_sites['phenol']['count']} phenol(s) - can undergo oxidation")
        
        elif stress_type == 'oxidative':
            # Oxidative stress targets: alcohols, amines, sulfides, aromatics
            score = 0
            reasons = []
            
            if reactive_sites['thioether']['count'] > 0:
                score += 40 * reactive_sites['thioether']['count']
                reasons.append(f"{reactive_sites['thioether']['count']} sulfide(s) - easily oxidized")
            
            if reactive_sites['secondary_alcohol']['count'] > 0:
                score += 25 * min(reactive_sites['secondary_alcohol']['count'], 2)
                reasons.append(f"{reactive_sites['secondary_alcohol']['count']} alcohol(s) - oxidation to ketone")
            
            if reactive_sites['primary_amine']['count'] > 0 or reactive_sites['secondary_amine']['count'] > 0:
                amine_count = reactive_sites['primary_amine']['count'] + reactive_sites['secondary_amine']['count']
                score += 20 * min(amine_count, 2)
                reasons.append(f"{amine_count} amine(s) - N-oxidation")
            
            if reactive_sites['aromatic_amine']['count'] > 0:
                score += 30 * reactive_sites['aromatic_amine']['count']
                reasons.append(f"{reactive_sites['aromatic_amine']['count']} aromatic amine(s) - highly susceptible")
        
        elif stress_type == 'thermal':
            # Thermal stress: decarboxylation, eliminations, rearrangements
            score = 0
            reasons = []
            
            # Beta-lactams are thermally labile
            if reactive_sites['lactam']['count'] > 0:
                score += 25 * reactive_sites['lactam']['count']
                reasons.append(f"Lactam(s) present - thermal ring opening")
            
            # High MW increases thermal stress susceptibility
            if descriptors['molecular_weight'] > 500:
                score += 20
                reasons.append("High molecular weight - increased thermal lability")
            
            # Many rotatable bonds = conformational flexibility = more pathways
            if descriptors['num_rotatable_bonds'] > 5:
                score += 15
                reasons.append("High conformational flexibility")
        
        elif stress_type == 'photolytic':
            # Photolytic stress: aromatics, conjugated systems, chromophores
            score = 0
            reasons = []
            
            if descriptors['num_aromatic_rings'] > 0:
                score += 30 * min(descriptors['num_aromatic_rings'], 3)
                reasons.append(f"{descriptors['num_aromatic_rings']} aromatic ring(s) - UV absorption")
            
            if reactive_sites['enone']['count'] > 0:
                score += 35 * reactive_sites['enone']['count']
                reasons.append(f"{reactive_sites['enone']['count']} α,β-unsaturated carbonyl(s) - photoreactive")
            
            if reactive_sites['aromatic_amine']['count'] > 0:
                score += 25 * reactive_sites['aromatic_amine']['count']
                reasons.append(f"Aromatic amine(s) - photosensitive")
        
        else:
            score = 50
            reasons = ["Unknown stress type - default moderate susceptibility"]
        
        # Cap score at 100
        score = min(score, 100)
        
        return {
            'susceptibility_score': score,
            'level': 'HIGH' if score > 70 else 'MODERATE' if score > 40 else 'LOW',
            'reasons': reasons,
            'reactive_sites': reactive_sites
        }
    
    def estimate_degradation_rate(self, smiles, stress_type, temperature=25):
        """
        Estimate degradation rate constant (k) using QSAR-like approach
        
        Returns estimated k (h⁻¹) and half-life
        """
        
        susceptibility = self.predict_degradation_susceptibility(smiles, stress_type)
        descriptors = self.calculate_descriptors(smiles)
        
        # Base rate constants (empirical, h⁻¹ at 25°C)
        base_k = {
            'acid': 0.01,
            'base': 0.015,
            'oxidative': 0.005,
            'thermal': 0.002,
            'photolytic': 0.008
        }
        
        k_base = base_k.get(stress_type, 0.005)
        
        # Adjust based on susceptibility score
        k_factor = 1 + (susceptibility['susceptibility_score'] / 50)
        
        # Adjust for molecular weight (larger molecules degrade slower)
        mw_factor = max(0.5, 1 - (descriptors['molecular_weight'] - 300) / 1000)
        
        # Temperature correction (Arrhenius-like)
        if temperature != 25:
            # Assume Ea = 50 kJ/mol
            temp_factor = np.exp((50000 / 8.314) * ((1/298) - (1/(temperature + 273))))
        else:
            temp_factor = 1.0
        
        k_estimated = k_base * k_factor * mw_factor * temp_factor
        
        # Half-life
        t_half = 0.693 / k_estimated  # hours
        
        return {
            'rate_constant_k': float(k_estimated),
            'half_life_hours': float(t_half),
            'half_life_days': float(t_half / 24),
            'factors': {
                'base_k': k_base,
                'susceptibility_factor': k_factor,
                'mw_factor': mw_factor,
                'temperature_factor': temp_factor
            }
        }

def main():
    """Demo usage"""
    print("=" * 60)
    print("Molecular Feature Extraction Demo")
    print("=" * 60)
    
    extractor = MolecularFeatureExtractor()
    
    # Example: Aspirin (acetylsalicylic acid)
    aspirin_smiles = "CC(=O)Oc1ccccc1C(=O)O"
    
    print(f"\nMolecule: Aspirin")
    print(f"SMILES: {aspirin_smiles}")
    
    # Calculate descriptors
    print("\n1. Molecular Descriptors:")
    descriptors = extractor.calculate_descriptors(aspirin_smiles)
    for key, value in list(descriptors.items())[:10]:
        print(f"  {key}: {value:.2f}")
    
    # Identify reactive sites
    print("\n2. Reactive Sites:")
    sites = extractor.identify_reactive_sites(aspirin_smiles)
    for site, data in sites.items():
        if data['count'] > 0:
            print(f"  {site}: {data['count']} site(s)")
    
    # Predict degradation
    print("\n3. Degradation Susceptibility:")
    for stress_type in ['acid', 'base', 'oxidative']:
        pred = extractor.predict_degradation_susceptibility(aspirin_smiles, stress_type)
        print(f"\n  {stress_type.upper()} Stress:")
        print(f"    Score: {pred['susceptibility_score']}/100 ({pred['level']})")
        for reason in pred['reasons']:
            print(f"    - {reason}")
    
    # Estimate rate
    print("\n4. Degradation Kinetics (Base Stress, 40°C):")
    kinetics = extractor.estimate_degradation_rate(aspirin_smiles, 'base', temperature=40)
    print(f"  k = {kinetics['rate_constant_k']:.4f} h⁻¹")
    print(f"  t½ = {kinetics['half_life_hours']:.1f} hours ({kinetics['half_life_days']:.1f} days)")
    
    print("\n" + "=" * 60)
    print("✓ Demo Complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()

"""
Degradation Product Prediction
Applies chemical transformation rules to predict degradation products
"""

from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors
import json
from molecularFeatures import MolecularFeatureExtractor

class DegradationProductPredictor:
    def __init__(self):
        self.feature_extractor = MolecularFeatureExtractor()
        
        self.degradation_rules = {
            'acid_hydrolysis': {
                'ester_hydrolysis': {
                    'smarts': '[C,c:1](=[O:2])[O:3][C,c:4]>>[C,c:1](=[O:2])[OH].[C,c:4][O:3][H]',
                    'description': 'Ester hydrolysis to carboxylic acid + alcohol',
                    'conditions': ['acid', 'base']
                },
                'amide_hydrolysis': {
                    'smarts': '[C,c:1](=[O:2])[N:3][C,c:4]>>[C,c:1](=[O:2])[OH].[C,c:4][N:3][H]',
                    'description': 'Amide hydrolysis to carboxylic acid + amine',
                    'conditions': ['acid', 'base']
                },
                'lactone_opening': {
                    'smarts': '[C,c:1](=[O:2])[O:3][C,c:4]>>[C,c:1](=[O:2])[OH].[C,c:4][O:3][H]',
                    'description': 'Lactone ring opening',
                    'conditions': ['acid', 'base']
                }
            },
            'oxidation': {
                'alcohol_oxidation': {
                    'smarts': '[C][CH2][OH]>>[C][CH]=O',
                    'description': 'Primary alcohol to aldehyde',
                    'conditions': ['oxidative']
                },
                'secondary_alcohol_oxidation': {
                    'smarts': '[C][CH]([OH])[C]>>[C][C](=O)[C]',
                    'description': 'Secondary alcohol to ketone',
                    'conditions': ['oxidative']
                },
                'sulfide_oxidation': {
                    'smarts': '[C][S][C]>>[C][S](=O)[C]',
                    'description': 'Sulfide to sulfoxide',
                    'conditions': ['oxidative']
                },
                'amine_oxidation': {
                    'smarts': '[C][NH2]>>[C][NH]=O',
                    'description': 'Primary amine N-oxidation',
                    'conditions': ['oxidative']
                }
            },
            'decarboxylation': {
                'carboxylic_acid_loss': {
                    'smarts': '[C][C](=O)[OH]>>[C]',
                    'description': 'Decarboxylation (loss of CO2)',
                    'conditions': ['thermal', 'photolytic']
                }
            },
            'photolysis': {
                'aromatic_hydroxylation': {
                    'smarts': 'c1ccccc1>>c1cc(O)ccc1',
                    'description': 'Aromatic hydroxylation',
                    'conditions': ['photolytic', 'oxidative']
                }
            }
        }
    
    def predict_products(self, parent_smiles, stress_type, max_products=5):
        """
        Predict degradation products for given parent molecule and stress type
        
        Args:
            parent_smiles: Parent API SMILES
            stress_type: 'acid', 'base', 'oxidative', 'thermal', 'photolytic'
            max_products: Maximum number of products to return
        
        Returns:
            List of predicted degradation products with metadata
        """
        
        parent_mol = Chem.MolFromSmiles(parent_smiles)
        if parent_mol is None:
            raise ValueError(f"Invalid SMILES: {parent_smiles}")
        
        parent_mw = Descriptors.MolWt(parent_mol)
        
        products = []
        
        # Apply relevant transformation rules
        for category, rules in self.degradation_rules.items():
            for rule_name, rule_data in rules.items():
                
                # Check if rule applies to this stress type
                if stress_type not in rule_data['conditions']:
                    continue
                
                # Try to apply reaction
                rxn = AllChem.ReactionFromSmarts(rule_data['smarts'])
                product_sets = rxn.RunReactants((parent_mol,))
                
                for product_set in product_sets:
                    for product_mol in product_set:
                        try:
                            Chem.SanitizeMol(product_mol)
                            product_smiles = Chem.MolToSmiles(product_mol)
                            product_mw = Descriptors.MolWt(product_mol)
                            
                            # Calculate stoichiometric factor (omega)
                            omega = parent_mw / product_mw
                            
                            products.append({
                                'smiles': product_smiles,
                                'molecular_weight': round(product_mw, 2),
                                'omega': round(omega, 3),
                                'pathway': rule_data['description'],
                                'rule_applied': rule_name,
                                'category': category,
                                'confidence': self._estimate_confidence(parent_mol, product_mol, stress_type)
                            })
                        
                        except Exception as e:
                            continue  # Skip invalid products
        
        # Remove duplicates
        unique_products = []
        seen_smiles = set()
        
        for product in products:
            if product['smiles'] not in seen_smiles:
                seen_smiles.add(product['smiles'])
                unique_products.append(product)
        
        # Sort by confidence
        unique_products.sort(key=lambda x: x['confidence'], reverse=True)
        
        return unique_products[:max_products]
    
    def _estimate_confidence(self, parent_mol, product_mol, stress_type):
        """
        Estimate confidence in predicted product
        
        Based on:
        - Structural similarity to parent
        - Known reactivity patterns
        - Stress type appropriateness
        """
        
        # Tanimoto similarity
        parent_fp = AllChem.GetMorganFingerprintAsBitVect(parent_mol, 2)
        product_fp = AllChem.GetMorganFingerprintAsBitVect(product_mol, 2)
        similarity = AllChem.DataStructs.TanimotoSimilarity(parent_fp, product_fp)
        
        # Base confidence on similarity (similar structure = more likely)
        confidence = similarity * 100
        
        # Adjust for stress type specificity
        stress_confidence_multipliers = {
            'acid': 0.9,
            'base': 0.95,
            'oxidative': 0.85,
            'thermal': 0.75,
            'photolytic': 0.7
        }
        
        multiplier = stress_confidence_multipliers.get(stress_type, 0.8)
        confidence *= multiplier
        
        return round(confidence, 1)
    
    def predict_mass_balance(self, parent_smiles, stress_type, degradation_percent=10):
        """
        Predict expected mass balance with degradation products
        
        Args:
            parent_smiles: Parent API SMILES
            stress_type: Stress condition
            degradation_percent: Expected degradation level (%)
        
        Returns:
            Predicted mass balance breakdown
        """
        
        parent_mol = Chem.MolFromSmiles(parent_smiles)
        parent_mw = Descriptors.MolWt(parent_mol)
        
        # Predict products
        products = self.predict_products(parent_smiles, stress_type, max_products=3)
        
        if not products:
            return {
                'predicted_lk_imb': 100 - degradation_percent,
                'predicted_cimb': 100 - degradation_percent,
                'note': 'No degradation products predicted'
            }
        
        # Assume equal distribution among predicted products
        percent_per_product = degradation_percent / len(products)
        
        # Calculate LK-IMB (uses omega)
        lk_degradants_contribution = sum(
            percent_per_product * product['omega'] 
            for product in products
        )
        predicted_lk_imb = (100 - degradation_percent) + lk_degradants_contribution
        
        # Calculate CIMB (uses stoichiometry)
        # Simplified: assume S-factor ≈ omega for prediction
        predicted_cimb = predicted_lk_imb
        
        return {
            'predicted_lk_imb': round(predicted_lk_imb, 2),
            'predicted_cimb': round(predicted_cimb, 2),
            'degradation_percent': degradation_percent,
            'num_products_predicted': len(products),
            'major_products': [
                {
                    'pathway': p['pathway'],
                    'omega': p['omega'],
                    'confidence': p['confidence']
                }
                for p in products
            ]
        }

def main():
    """Demo usage"""
    print("=" * 60)
    print("Degradation Product Prediction Demo")
    print("=" * 60)
    
    predictor = DegradationProductPredictor()
    
    # Example: Aspirin
    aspirin_smiles = "CC(=O)Oc1ccccc1C(=O)O"
    
    print(f"\nParent Molecule: Aspirin")
    print(f"SMILES: {aspirin_smiles}")
    
    # Predict products for different stress types
    for stress_type in ['acid', 'base', 'oxidative']:
        print(f"\n{'='*60}")
        print(f"{stress_type.upper()} STRESS DEGRADATION")
        print('='*60)
        
        products = predictor.predict_products(aspirin_smiles, stress_type, max_products=3)
        
        if products:
            print(f"\nPredicted {len(products)} degradation product(s):\n")
            
            for i, product in enumerate(products, 1):
                print(f"{i}. {product['pathway']}")
                print(f"   SMILES: {product['smiles']}")
                print(f"   MW: {product['molecular_weight']} g/mol")
                print(f"   Omega (ω): {product['omega']}")
                print(f"   Confidence: {product['confidence']}%")
                print()
        else:
            print("\nNo products predicted for this stress type.")
        
        # Predict mass balance
        mb_prediction = predictor.predict_mass_balance(aspirin_smiles, stress_type, degradation_percent=15)
        
        print(f"Mass Balance Prediction (15% degradation):")
        print(f"  Predicted LK-IMB: {mb_prediction['predicted_lk_imb']}%")
        print(f"  Predicted CIMB: {mb_prediction['predicted_cimb']}%")
    
    print("\n" + "=" * 60)
    print("✓ Demo Complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()

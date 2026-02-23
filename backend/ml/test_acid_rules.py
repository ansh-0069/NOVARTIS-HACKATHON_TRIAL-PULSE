from rdkit import Chem
from rdkit.Chem import AllChem

def test_reaction(name, smarts, smiles):
    print(f"\n--- Testing {name} ---")
    print(f"SMARTS: {smarts}")
    print(f"Reactant SMILES: {smiles}")
    
    try:
        rxn = AllChem.ReactionFromSmarts(smarts)
        reactant = Chem.MolFromSmiles(smiles)
        
        if reactant is None:
            print("Invalid reactant SMILES")
            return

        products = rxn.RunReactants((reactant,))
        
        if not products:
            print("No products generated.")
        
        for i, product_set in enumerate(products):
            print(f"Product Set {i+1}:")
            for mol in product_set:
                Chem.SanitizeMol(mol)
                print(f"  - {Chem.MolToSmiles(mol)}")
                
    except Exception as e:
        print(f"ERROR: {e}")

# Test Cases

# 1. Ester Hydrolysis
# Aspirin: CC(=O)Oc1ccccc1C(=O)O
aspirin = "CC(=O)Oc1ccccc1C(=O)O" 
# Pattern: Break C(=O)-O bond. Allow aromatic carbons [C,c] or [#6]
# [C,c:1](=[O:2])[O:3][C,c:4]>>[C,c:1](=[O:2])[OH].[C,c:4][O:3][H]
ester_smarts_mapped = '[C,c:1](=[O:2])[O:3][C,c:4]>>[C,c:1](=[O:2])[OH].[C,c:4][O:3][H]'

test_reaction("Ester Hydrolysis (Correct Mapped)", ester_smarts_mapped, aspirin)

# 2. Amide Hydrolysis
# Paracetamol: CC(=O)Nc1ccc(O)cc1
paracetamol = "CC(=O)Nc1ccc(O)cc1"
# [C,c:1](=[O:2])[N:3][C,c:4]
amide_smarts_mapped = '[C,c:1](=[O:2])[N:3][C,c:4]>>[C,c:1](=[O:2])[OH].[C,c:4][N:3][H]'

test_reaction("Amide Hydrolysis (Correct Mapped)", amide_smarts_mapped, paracetamol)

# 3. Lactone Opening
# delta-Valerolactone: O=C1CCCCO1
lactone = "O=C1CCCCO1"
# Same ester pattern should work for lactone if RDKit handles ring opening correctly with same mapping
test_reaction("Lactone Opening (Using Ester Rule)", ester_smarts_mapped, lactone)

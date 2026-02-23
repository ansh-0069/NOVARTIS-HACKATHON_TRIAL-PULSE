"""
Degradation Prediction Service
Microservice for molecular predictions
"""

import sys
import json
from degradationPredictor import DegradationProductPredictor
from molecularFeatures import MolecularFeatureExtractor

def prediction_service(request_json):
    """
    Service endpoint for degradation predictions
    
    Request format:
    {
        "action": "predict_products" | "predict_mb" | "analyze_structure",
        "smiles": "...",
        "stress_type": "acid|base|oxidative|thermal|photolytic",
        "degradation_percent": float (optional)
    }
    """
    try:
        request = json.loads(request_json)
        action = request.get('action', 'predict_products')
        smiles = request.get('smiles')
        stress_type = request.get('stress_type', 'oxidative')
        
        if not smiles:
            return json.dumps({
                'success': False,
                'error': 'SMILES string required'
            })
        
        predictor = DegradationProductPredictor()
        extractor = MolecularFeatureExtractor()
        
        if action == 'predict_products':
            products = predictor.predict_products(smiles, stress_type, max_products=5)
            
            return json.dumps({
                'success': True,
                'action': 'predict_products',
                'result': {
                    'products': products,
                    'num_products': len(products)
                }
            }, indent=2)
        
        elif action == 'predict_mb':
            degradation_percent = request.get('degradation_percent', 10)
            mb_prediction = predictor.predict_mass_balance(smiles, stress_type, degradation_percent)
            
            return json.dumps({
                'success': True,
                'action': 'predict_mb',
                'result': mb_prediction
            }, indent=2)
        
        elif action == 'analyze_structure':
            descriptors = extractor.calculate_descriptors(smiles)
            susceptibility = extractor.predict_degradation_susceptibility(smiles, stress_type)
            kinetics = extractor.estimate_degradation_rate(smiles, stress_type, temperature=25)
            reactive_sites = extractor.identify_reactive_sites(smiles)
            
            return json.dumps({
                'success': True,
                'action': 'analyze_structure',
                'result': {
                    'molecular_descriptors': descriptors,
                    'degradation_susceptibility': susceptibility,
                    'kinetics': kinetics,
                    'reactive_sites': reactive_sites
                }
            }, indent=2)
        
        else:
            return json.dumps({
                'success': False,
                'error': f'Unknown action: {action}'
            })
    
    except Exception as e:
        return json.dumps({
            'success': False,
            'error': str(e),
            'type': type(e).__name__
        })

if __name__ == '__main__':
    if len(sys.argv) > 1:
        request_json = sys.argv[1]
    else:
        request_json = sys.stdin.read()
    
    result = prediction_service(request_json)
    print(result)

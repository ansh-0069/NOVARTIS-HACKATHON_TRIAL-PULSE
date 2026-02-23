
import sys
import json
import math
import numpy as np
from scipy import stats

def bayesian_update(prior_mean, prior_std, data_mean, data_std, n):
    """
    Update Gaussian prior with Gaussian likelihood (Normal-Normal model).
    Assumes known variance for simplicity (using the sample variance as approximation).
    """
    
    # Precision = 1 / Variance
    prior_precision = 1 / (prior_std ** 2) if prior_std > 0 else 1e-6
    data_precision = n / (data_std ** 2) if data_std > 0 else 1e-6 # Precision of the sampling distribution of the mean
    
    posterior_precision = prior_precision + data_precision
    posterior_variance = 1 / posterior_precision
    posterior_std = math.sqrt(posterior_variance)
    
    posterior_mean = (prior_precision * prior_mean + data_precision * data_mean) / posterior_precision
    
    # Calculate 95% Credible Interval
    # For Normal posterior, it's Mean +/- 1.96 * Std
    lower_ci = posterior_mean - 1.96 * posterior_std
    upper_ci = posterior_mean + 1.96 * posterior_std
    
    return {
        "posterior_mean": float(posterior_mean),
        "posterior_std": float(posterior_std),
        "credible_interval_95": [float(lower_ci), float(upper_ci)],
        "prior_weight": float(prior_precision / posterior_precision),
        "data_weight": float(data_precision / posterior_precision)
    }

if __name__ == "__main__":
    try:
        input_str = sys.stdin.read()
        if not input_str:
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
            
        data = json.loads(input_str)
        
        prior_mean = data.get('prior_mean')
        prior_std = data.get('prior_std')
        new_data_mean = data.get('data_mean')
        new_data_std = data.get('data_std')
        n = data.get('n', 3) # Default to triplicate
        
        result = bayesian_update(prior_mean, prior_std, new_data_mean, new_data_std, n)
        print(json.dumps(result))
        sys.stdout.flush()
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.stdout.flush()
        sys.exit(1)

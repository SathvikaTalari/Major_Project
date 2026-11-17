import numpy as np


def compute_ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
    """Normalized Difference Vegetation Index: (NIR - RED) / (NIR + RED)."""
    denom = nir + red
    return np.where(denom == 0, 0.0, (nir - red) / denom)


def compute_mndwi(green: np.ndarray, swir1: np.ndarray) -> np.ndarray:
    """Modified Normalized Difference Water Index: (GREEN - SWIR1) / (GREEN + SWIR1)."""
    denom = green + swir1
    return np.where(denom == 0, 0.0, (green - swir1) / denom)


def compute_ndbi(swir1: np.ndarray, nir: np.ndarray) -> np.ndarray:
    """Normalized Difference Built-up Index: (SWIR1 - NIR) / (SWIR1 + NIR)."""
    denom = swir1 + nir
    return np.where(denom == 0, 0.0, (swir1 - nir) / denom)


def compute_evi(nir: np.ndarray, red: np.ndarray, blue: np.ndarray) -> np.ndarray:
    """Enhanced Vegetation Index minimizing soil and atmospheric noise."""
    denom = nir + 6.0 * red - 7.5 * blue + 1.0
    return np.where(denom == 0, 0.0, 2.5 * ((nir - red) / denom))


def compute_lst_celsius(
    brightness_temp_k: np.ndarray,
    ndvi: np.ndarray,
    wavelength_um: float = 10.895,
    ndvi_min: float = 0.2,
    ndvi_max: float = 0.5,
) -> np.ndarray:
    """
    Mono-window LST retrieval in Celsius using NDVI-based proportional vegetation
    cover (Pv) and surface emissivity estimation.
    """
    pv = np.clip((ndvi - ndvi_min) / (ndvi_max - ndvi_min), 0.0, 1.0)
    emissivity = 0.004 * pv + 0.986
    rho = 14388.0  # h * c / sigma in um * K
    lst_k = brightness_temp_k / (
        1.0 + (wavelength_um * brightness_temp_k / rho) * np.log(emissivity)
    )
    return lst_k - 273.15

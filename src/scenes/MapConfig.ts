export interface MapConfig {
    model: string;
    scale: number;
    centerMap: boolean;
    physicsEnabled: boolean;
    sky: {
        luminance: number;
        turbidity: number;
        rayleigh: number;
        mieCoefficient: number;
        sunPosition: { x: number; y: number; z: number };
    };
    lighting: {
        ambientIntensity: number;
        sunIntensity: number;
        shadowResolution: number;
        shadowBias: number;
        shadowNormalBias: number;
    };
    fog: {
        enabled: boolean;
        color: [number, number, number];
        density: number;
    };
    playerSpawn?: { x: number; y: number; z: number };
}
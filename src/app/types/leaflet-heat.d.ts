import 'leaflet';

declare module 'leaflet' {
  export interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  export interface HeatLayer extends Layer {
    setLatLngs(latlngs: (LatLngExpression | [number, number, number])[]): this;
    addLatLng(latlng: LatLngExpression | [number, number, number]): this;
    setOptions(options: HeatLayerOptions): this;
    redraw(): this;
  }

  export function heatLayer(
    latlngs: (LatLngExpression | [number, number, number])[],
    options?: HeatLayerOptions
  ): HeatLayer;
}

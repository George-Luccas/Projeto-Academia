import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/theme';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  gradientColor?: string;
}

export default function LineChart({
  data,
  height = 180,
  color = '#D4FF13',
  gradientColor = '#D4FF13',
}: LineChartProps) {
  if (!data || data.length === 0) return null;

  const screenWidth = Dimensions.get('window').width - 64; // Padding horizontal
  const paddingLeft = 35;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = screenWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values) * 0.95; // Dá um respiro na base do gráfico
  const maxVal = Math.max(...values) * 1.05; // Dá um respiro no topo
  const valRange = maxVal - minVal || 1;

  // Gerar coordenadas X e Y para os pontos do SVG
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.value - minVal) / valRange) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  // Criar caminho (path) da linha do gráfico
  const linePath = points.reduce((path, p, idx) => {
    return path + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  // Criar caminho fechado para o preenchimento com gradiente sob a linha
  const fillPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

  // Gerar algumas linhas de grade horizontais (ex: 3 divisões)
  const gridLines = [0, 0.5, 1];

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={screenWidth} height={height}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={gradientColor} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={gradientColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Linhas de Grade e Valores do Eixo Y */}
        {gridLines.map((ratio, idx) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const gridVal = minVal + ratio * valRange;
          return (
            <React.Fragment key={idx}>
              {/* Linha pontilhada */}
              <Line
                x1={paddingLeft}
                y1={y}
                x2={screenWidth - paddingRight}
                y2={y}
                stroke="#27272A"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              {/* Texto de valor do eixo Y */}
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fill="#A1A1AA"
                fontSize="10"
                fontWeight="bold"
                textAnchor="end"
              >
                {Math.round(gridVal)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Preenchimento com Gradiente */}
        {fillPath !== '' && <Path d={fillPath} fill="url(#chartGradient)" />}

        {/* Linha do Gráfico */}
        {linePath !== '' && (
          <Path d={linePath} fill="transparent" stroke={color} strokeWidth="3" />
        )}

        {/* Pontos (Círculos) e Labels */}
        {points.map((p, idx) => (
          <React.Fragment key={idx}>
            {/* Círculo do ponto */}
            <Circle cx={p.x} cy={p.y} r="5" fill="#09090B" stroke={color} strokeWidth="2.5" />
            
            {/* Valor acima do ponto (só para início, fim e recorde para não poluir) */}
            {(idx === 0 || idx === points.length - 1 || p.value === Math.max(...values)) && (
              <SvgText
                x={p.x}
                y={p.y - 10}
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {p.value}kg
              </SvgText>
            )}

            {/* Label do Eixo X */}
            <SvgText
              x={p.x}
              y={paddingTop + chartHeight + 18}
              fill="#A1A1AA"
              fontSize="9"
              fontWeight="500"
              textAnchor="middle"
            >
              {p.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
});
export type { DataPoint };

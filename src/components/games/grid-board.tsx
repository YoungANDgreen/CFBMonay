import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { GridCellComponent } from './grid-cell';
import type { GridCell, GridCriteria } from '@/types';

interface GridBoardProps {
  cells: GridCell[][];
  rows: GridCriteria[];
  columns: GridCriteria[];
  selectedCell: { row: number; col: number } | null;
  onCellPress: (row: number, col: number) => void;
}

export function GridBoard({ cells, rows, columns, selectedCell, onCellPress }: GridBoardProps) {
  return (
    <View style={styles.container}>
      {/* Column headers */}
      <View style={styles.headerRow}>
        <View style={styles.cornerCell}>
          <View style={styles.cornerDiagonal} />
        </View>
        {columns.map((col, i) => (
          <View key={`col-${i}`} style={styles.headerCell}>
            <Text style={styles.headerText} numberOfLines={2}>
              {col.displayText}
            </Text>
            <View style={[styles.headerAccent, { backgroundColor: colors.accent }]} />
          </View>
        ))}
      </View>

      {/* Thin separator */}
      <View style={styles.separator} />

      {/* Grid rows */}
      {cells.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {/* Row header */}
          <View style={styles.rowHeaderCell}>
            <Text style={styles.headerText} numberOfLines={2}>
              {rows[rowIndex].displayText}
            </Text>
            <View style={[styles.rowHeaderAccent, { backgroundColor: colors.accent }]} />
          </View>

          {/* Grid cells */}
          {row.map((cell, colIndex) => (
            <GridCellComponent
              key={`cell-${rowIndex}-${colIndex}`}
              cell={cell}
              isSelected={
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex
              }
              onPress={() => onCellPress(rowIndex, colIndex)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  cornerCell: {
    width: 80,
    marginRight: 2,
    position: 'relative',
  },
  cornerDiagonal: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 2,
    backgroundColor: colors.border,
    transform: [{ rotate: '-45deg' }],
  },
  headerCell: {
    flex: 1,
    margin: 2,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border + '60',
  },
  headerText: {
    color: colors.accent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerAccent: {
    width: 16,
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border + '30',
    marginHorizontal: spacing.sm,
    marginVertical: 2,
  },
  gridRow: {
    flexDirection: 'row',
  },
  rowHeaderCell: {
    width: 80,
    marginRight: 2,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border + '60',
    margin: 2,
  },
  rowHeaderAccent: {
    width: 16,
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },
});

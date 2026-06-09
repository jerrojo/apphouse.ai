/**
 * Home Screen — PRISMA Template Mobile
 * Replace this with your app's actual home/dashboard screen.
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, radius, shadows } from "../lib/theme";

interface QuickAction {
  emoji: string;
  label: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { emoji: "⚡", label: "Live Session",  description: "Start a real-time agent session" },
  { emoji: "🤖", label: "Agent Chat",    description: "Chat with your AI team" },
  { emoji: "✅", label: "Tasks",         description: "Review pending tasks" },
  { emoji: "📊", label: "Weekly's",      description: "This week's intelligence report" },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoDot} />
            <Text style={styles.logoText}>PRISMA</Text>
          </View>
          <Text style={styles.greeting}>Good morning, Builder</Text>
          <Text style={styles.subtitle}>Your AI team is ready.</Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { value: "3",  label: "Active Projects" },
            { value: "12", label: "Agents Online" },
            { value: "5",  label: "Tasks Due" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity key={action.label} style={styles.actionCard} activeOpacity={0.75}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDesc}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Open Dashboard →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing["5"], paddingBottom: spacing["12"] },
  header: { marginBottom: spacing["8"], paddingTop: spacing["4"] },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing["2"], marginBottom: spacing["6"] },
  logoDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.accent, ...shadows.glow },
  logoText: { fontSize: typography.sm, fontWeight: "700", color: colors.muted, letterSpacing: 3 },
  greeting: { fontSize: typography["3xl"], fontWeight: "700", color: colors.foreground, letterSpacing: -0.5 },
  subtitle: { fontSize: typography.base, color: colors.muted, marginTop: spacing["1"] },
  statsRow: { flexDirection: "row", gap: spacing["3"], marginBottom: spacing["8"] },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing["4"], borderWidth: 1, borderColor: colors.borderSubtle, alignItems: "center" },
  statValue: { fontSize: typography["2xl"], fontWeight: "700", color: colors.foreground, letterSpacing: -0.5 },
  statLabel: { fontSize: typography.xs, color: colors.muted, marginTop: spacing["1"], textAlign: "center" },
  sectionTitle: { fontSize: typography.sm, fontWeight: "600", color: colors.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: spacing["3"] },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing["3"], marginBottom: spacing["8"] },
  actionCard: { width: "47%", backgroundColor: colors.surface, borderRadius: radius["2xl"], padding: spacing["5"], borderWidth: 1, borderColor: colors.borderSubtle },
  actionEmoji: { fontSize: 24, marginBottom: spacing["2"] },
  actionLabel: { fontSize: typography.base, fontWeight: "600", color: colors.foreground, marginBottom: spacing["1"] },
  actionDesc: { fontSize: typography.xs, color: colors.muted },
  ctaButton: { backgroundColor: colors.accent, borderRadius: radius.full, paddingVertical: spacing["4"], alignItems: "center", ...shadows.glow },
  ctaText: { fontSize: typography.base, fontWeight: "700", color: "#ffffff", letterSpacing: 0.2 },
});

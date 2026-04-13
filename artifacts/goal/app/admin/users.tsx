import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllUsers, updateUserStatus, deleteUser, type UserProfile } from '@/services/adminService';

type ActionType = 'warn' | 'block' | 'ban' | 'make_vip' | 'make_admin' | 'delete';

function UserCard({
  user,
  colors,
  onAction,
}: {
  user: UserProfile;
  colors: any;
  onAction: (type: ActionType, userId: string, user: UserProfile) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const name = user.full_name || user.email?.split('@')[0] || 'User';
  const initial = name.charAt(0).toUpperCase();

  const statusColor = user.is_banned ? colors.live : user.is_blocked ? '#FF9500' : colors.accent;
  const statusLabel = user.is_banned ? 'Banni' : user.is_blocked ? 'Bloqué' : 'Actif';

  return (
    <View style={[styles.userCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.userCardHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { backgroundColor: statusColor + '25' }]}>
          <Text style={[styles.avatarText, { color: statusColor }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            {user.is_vip && (
              <View style={[styles.badge, { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: 'rgba(255,215,0,0.4)' }]}>
                <Text style={{ fontSize: 9, color: '#FFD700', fontWeight: '700' }}>VIP</Text>
              </View>
            )}
            {user.is_admin && (
              <View style={[styles.badge, { backgroundColor: colors.accentDim, borderColor: colors.accent + '40' }]}>
                <Text style={{ fontSize: 9, color: colors.accent, fontWeight: '700' }}>ADMIN</Text>
              </View>
            )}
          </View>
          <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>{user.email}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.userActions, { borderTopColor: colors.border }]}>
          {user.warning_count ? (
            <Text style={[styles.warnCount, { color: '#FF9500' }]}>
              ⚠ {user.warning_count} avertissement{user.warning_count > 1 ? 's' : ''}
            </Text>
          ) : null}
          <View style={styles.actionBtns}>
            <ActionBtn
              icon="alert-triangle"
              label="Avertir"
              color="#FF9500"
              onPress={() => onAction('warn', user.id, user)}
            />
            <ActionBtn
              icon="slash"
              label={user.is_blocked ? 'Débloquer' : 'Bloquer'}
              color={user.is_blocked ? colors.accent : '#FF6B35'}
              onPress={() => onAction('block', user.id, user)}
            />
            <ActionBtn
              icon="x-octagon"
              label={user.is_banned ? 'Débannir' : 'Bannir'}
              color={user.is_banned ? colors.accent : colors.live}
              onPress={() => onAction('ban', user.id, user)}
            />
            <ActionBtn
              icon="star"
              label={user.is_vip ? 'Retirer VIP' : 'Mettre VIP'}
              color={colors.gold}
              onPress={() => onAction('make_vip', user.id, user)}
            />
            <ActionBtn
              icon="trash-2"
              label="Supprimer"
              color={colors.live}
              onPress={() => onAction('delete', user.id, user)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function ActionBtn({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.actionBtn, { backgroundColor: color + '15', borderColor: color + '30' }]} activeOpacity={0.7}>
      <Feather name={icon as any} size={13} color={color} />
      <Text style={{ fontSize: 10, color, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function UsersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'banned' | 'blocked'>('all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
  });

  const mutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) =>
      updateUserStatus(userId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q)
      );
    }
    if (filter === 'vip') result = result.filter((u) => u.is_vip);
    if (filter === 'banned') result = result.filter((u) => u.is_banned);
    if (filter === 'blocked') result = result.filter((u) => u.is_blocked);
    return result;
  }, [users, search, filter]);

  const handleAction = (type: ActionType, userId: string, user: UserProfile) => {
    if (type === 'delete') {
      Alert.alert(
        'Supprimer l\'utilisateur',
        `Supprimer ${user.full_name || user.email} ? Cette action est irréversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(userId),
          },
        ]
      );
      return;
    }

    const updates: any = {};
    let confirmMsg = '';

    if (type === 'warn') {
      updates.warning_count = (user.warning_count || 0) + 1;
      confirmMsg = `Envoyer un avertissement à ${user.full_name || user.email} ?`;
    } else if (type === 'block') {
      updates.is_blocked = !user.is_blocked;
      confirmMsg = user.is_blocked
        ? `Débloquer ${user.full_name || user.email} ?`
        : `Bloquer ${user.full_name || user.email} ?`;
    } else if (type === 'ban') {
      updates.is_banned = !user.is_banned;
      confirmMsg = user.is_banned
        ? `Débannir ${user.full_name || user.email} ?`
        : `Bannir ${user.full_name || user.email} ?`;
    } else if (type === 'make_vip') {
      updates.is_vip = !user.is_vip;
      confirmMsg = user.is_vip
        ? `Retirer le statut VIP à ${user.full_name || user.email} ?`
        : `Accorder le VIP à ${user.full_name || user.email} ?`;
    }

    Alert.alert('Confirmer', confirmMsg, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: () => mutation.mutate({ userId, updates }) },
    ]);
  };

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'vip', label: 'VIP' },
    { key: 'blocked', label: 'Bloqués' },
    { key: 'banned', label: 'Bannis' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Utilisateurs</Text>
        <Text style={[styles.headerCount, { color: colors.textMuted }]}>
          {users?.length ?? 0}
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.key ? colors.accent : colors.backgroundCard,
                borderColor: filter === f.key ? colors.accent : colors.border,
              },
            ]}
          >
            <Text style={{ color: filter === f.key ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="users" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun utilisateur trouvé</Text>
            </View>
          ) : (
            filtered.map((user) => (
              <UserCard key={user.id} user={user} colors={colors} onAction={handleAction} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  headerCount: { fontSize: 14 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },

  filterRow: { paddingHorizontal: 14, gap: 8, marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },

  list: { paddingHorizontal: 14, gap: 10 },

  userCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: { fontSize: 14, fontWeight: '600' },
  userEmail: { fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  userActions: {
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  warnCount: { fontSize: 12, fontWeight: '600' },
  actionBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});

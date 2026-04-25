import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image
} from 'react-native'
import React, { useState, useMemo } from 'react'
import { Announcement } from '@/types/general/home'
import { useQuery } from '@tanstack/react-query'
import { announcementApiClient } from '@/lib/client/announcement'
import { THEME } from '@/constants/theme'
import { useTranslation } from 'react-i18next'
import { uploaderLabel } from '@/utils/home/home'
import { router } from 'expo-router'
const PAGE_SIZE = 10

const all = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => (await announcementApiClient.get('/')).data,
  })

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase()
    return data.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    )
  }, [data, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = (text: string) => {
    setSearch(text)
    setPage(1)
  }

  const getUploaderName = (uploader: Announcement['uploader']) => {
    const full = `${uploader?.first_name ?? ''} ${uploader?.last_name ?? ''}`.trim()
    return full || t('announcements.unknown')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>
          {t('announcements.loading')}
        </Text>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 24 }}>
        <Text style={{ fontSize: 40 }}>📢</Text>
        <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: '#111827' }}>
          {t('announcements.error_title')}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
          {t('announcements.error_subtitle')}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{
            marginTop: 20,
            backgroundColor: THEME.primary,
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
            {t('announcements.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>

      {/* Header */}
      <View style={{
        backgroundColor: THEME.primary,
        paddingTop: 56,
        paddingBottom: 20,
        paddingHorizontal: 20,
      }}>

         {/* Back Button — sits at the very top */}
  <TouchableOpacity
    onPress={() => router.push('/(tabs)')}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
      backgroundColor: 'rgba(255,255,255,0.15)',
    }}
  >
    <Text style={{ color: '#fff', fontSize: 16, marginRight: 4, lineHeight: 18 }}>‹</Text>
    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
      {t('announcements.back')}
    </Text>
  </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>
          {t('announcements.title')}
        </Text>
        <Text style={{ color: THEME.primaryLight, fontSize: 13, marginTop: 2 }}>
          {filtered.length} {t('announcements.count')}
        </Text>


        {/* Search Bar */}
        <View style={{
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 2,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
        }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={handleSearch}
            placeholder={t('announcements.search_placeholder')}
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{ flex: 1, color: '#fff', fontSize: 14, paddingVertical: 10 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, paddingLeft: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Announcement List */}
      <FlatList
        data={paginated}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: '#374151' }}>
              {t('announcements.empty_title')}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: '#9CA3AF' }}>
              {t('announcements.empty_subtitle')}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const imageMedia = item.media.filter(m => m.media_type === 'image')
          const videoMedia = item.media.filter(m => m.media_type === 'video')

          return (
            <TouchableOpacity onPress={() => router.push(`/announcements/${item.id}`)} style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 16,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              borderLeftWidth: 4,
              borderLeftColor: THEME.primary,
            }}>

              {/* Uploader Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                {item.uploader?.profile_image ? (
                  <Image
                    source={{ uri: item.uploader.profile_image }}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      marginRight: 10,
                      backgroundColor: THEME.primaryMuted,
                    }}
                  />
                ) : (
                  <View style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: THEME.primaryMuted,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: THEME.primary }}>
                   {uploaderLabel(item.uploader).charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                   {uploaderLabel(item.uploader)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>

                <View style={{
                  backgroundColor: THEME.primaryMuted,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 20,
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: THEME.primary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    {t('announcements.badge')}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', lineHeight: 22 }}>
                {item.title}
              </Text>

              {/* Content */}
              <Text numberOfLines={3} style={{ fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 20 }}>
                {item.content}
              </Text>

              {/* Image Thumbnails */}
              {imageMedia.length > 0 && (
                <View style={{ flexDirection: 'row', marginTop: 10, gap: 6 }}>
                  {imageMedia.slice(0, 3).map((m, i) => (
                    <Image
                      key={m.id}
                      source={{ uri: m.media_url }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        backgroundColor: THEME.primaryMuted,
                      }}
                      resizeMode="cover"
                    />
                  ))}
                  {imageMedia.length > 3 && (
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      backgroundColor: THEME.primaryMuted,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.primary }}>
                        +{imageMedia.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Video count badge */}
              {videoMedia.length > 0 && (
                <View style={{
                  marginTop: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Text style={{ fontSize: 12 }}>🎬</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    {videoMedia.length} {t(videoMedia.length === 1 ? 'announcements.video' : 'announcements.videos')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          gap: 8,
        }}>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: page === 1 ? '#E5E7EB' : THEME.primary,
              backgroundColor: page === 1 ? '#F9FAFB' : THEME.primaryMuted,
            }}
          >
            <Text style={{ color: page === 1 ? '#D1D5DB' : THEME.primary, fontWeight: '600', fontSize: 13 }}>
              ‹ {t('announcements.prev')}
            </Text>
          </TouchableOpacity>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | string)[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
              acc.push(p)
              return acc
            }, [])
            .map((p, idx) =>
              p === '...' ? (
                <Text key={`dot-${idx}`} style={{ color: '#9CA3AF', fontSize: 13 }}>…</Text>
              ) : (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPage(p as number)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: page === p ? THEME.primary : 'transparent',
                    borderWidth: page === p ? 0 : 1,
                    borderColor: '#E5E7EB',
                  }}
                >
                  <Text style={{ color: page === p ? '#fff' : '#374151', fontWeight: '600', fontSize: 13 }}>
                    {p}
                  </Text>
                </TouchableOpacity>
              )
            )}

          <TouchableOpacity
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: page === totalPages ? '#E5E7EB' : THEME.primary,
              backgroundColor: page === totalPages ? '#F9FAFB' : THEME.primaryMuted,
            }}
          >
            <Text style={{ color: page === totalPages ? '#D1D5DB' : THEME.primary, fontWeight: '600', fontSize: 13 }}>
              {t('announcements.next')} ›
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

export default all
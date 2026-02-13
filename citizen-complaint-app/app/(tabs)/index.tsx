import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Static announcement data
const announcements = [
  {
    id: '1',
    title: 'Municipal Assembly Meeting',
    description: 'All residents are invited to attend the monthly municipal assembly. Discuss community concerns and upcoming projects.',
    date: 'February 20, 2026',
    time: '2:00 PM',
    location: 'Municipal Hall',
    type: 'meeting',
    isUrgent: true,
  },
  {
    id: '2',
    title: 'Waste Segregation Reminder',
    description: 'Please observe proper waste segregation. Biodegradable on Monday/Thursday, Non-biodegradable on Tuesday/Friday.',
    date: 'Ongoing',
    type: 'reminder',
    isUrgent: false,
  },
  {
    id: '3',
    title: 'Water Interruption Notice',
    description: 'Scheduled water maintenance will be conducted in Zone 1 and Zone 2. Please store water in advance.',
    date: 'February 18, 2026',
    time: '8:00 AM - 5:00 PM',
    location: 'Zone 1 & 2',
    type: 'notice',
    isUrgent: true,
  },
  {
    id: '4',
    title: 'Senior Citizen Cash Assistance',
    description: 'Distribution of quarterly cash assistance for senior citizens. Please bring valid ID and claim stub.',
    date: 'February 25-28, 2026',
    time: '9:00 AM - 4:00 PM',
    location: 'Municipal Hall',
    type: 'program',
    isUrgent: false,
  },
  {
    id: '5',
    title: 'COVID-19 Vaccination Drive',
    description: 'Free booster shots available for all eligible residents. Walk-in vaccinations welcome.',
    date: 'February 22, 2026',
    time: '8:00 AM - 2:00 PM',
    location: 'Municipal Health Center',
    type: 'health',
    isUrgent: false,
  },
];

export default function HomeScreen() {
  const handleSubmitComplaint = () => {
    // Navigation will be added here
    console.log('Navigate to submit complaint');
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'people';
      case 'reminder':
        return 'megaphone';
      case 'notice':
        return 'alert-circle';
      case 'program':
        return 'gift';
      case 'health':
        return 'medical';
      default:
        return 'information-circle';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6 bg-blue-600">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-white/90 text-sm font-medium mb-1">
                Municipality of
              </Text>
              <Text className="text-white text-2xl font-bold mb-0.5">
                Santa Maria
              </Text>
              <Text className="text-blue-100 text-sm">
                Laguna, Philippines
              </Text>
            </View>
            <TouchableOpacity 
              className="bg-white/20 rounded-full p-3"
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="bg-white/10 rounded-2xl p-5 border border-white/20">
            <View className="flex-row items-center mb-2">
              <Ionicons name="home" size={20} color="white" />
              <Text className="text-white text-sm font-medium ml-2">
                Welcome to
              </Text>
            </View>
            <Text className="text-white text-lg font-bold">
              Municipal Government Portal
            </Text>
          </View>
        </View>

        {/* Quick Stats or Services - Optional Enhancement */}
        <View className="px-6 py-6 bg-white border-b border-gray-100">
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <View className="bg-blue-50 rounded-full p-3 mb-2">
                <Ionicons name="document-text" size={24} color="#3B82F6" />
              </View>
              <Text className="text-gray-800 text-xs font-semibold">
                Services
              </Text>
            </View>
            <View className="items-center flex-1">
              <View className="bg-green-50 rounded-full p-3 mb-2">
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              </View>
              <Text className="text-gray-800 text-xs font-semibold">
                Reports
              </Text>
            </View>
            <View className="items-center flex-1">
              <View className="bg-purple-50 rounded-full p-3 mb-2">
                <Ionicons name="calendar" size={24} color="#8B5CF6" />
              </View>
              <Text className="text-gray-800 text-xs font-semibold">
                Events
              </Text>
            </View>
            <View className="items-center flex-1">
              <View className="bg-orange-50 rounded-full p-3 mb-2">
                <Ionicons name="call" size={24} color="#F97316" />
              </View>
              <Text className="text-gray-800 text-xs font-semibold">
                Hotlines
              </Text>
            </View>
          </View>
        </View>

        {/* Announcements Section */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <View className="bg-blue-100 rounded-lg p-2 mr-3">
                <Ionicons name="megaphone" size={20} color="#3B82F6" />
              </View>
              <Text className="text-gray-900 text-xl font-bold">
                Announcements
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-blue-600 text-sm font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Announcement Cards */}
          <View className="gap-4">
            {announcements.map((announcement) => (
              <TouchableOpacity
                key={announcement.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                activeOpacity={0.7}
              >
                {announcement.isUrgent && (
                  <View className="bg-red-500 px-4 py-2">
                    <Text className="text-white text-xs font-bold tracking-wide">
                      ⚠️ URGENT ANNOUNCEMENT
                    </Text>
                  </View>
                )}
                
                <View className="p-5">
                  {/* Header */}
                  <View className="flex-row items-start mb-4">
                    <View className="bg-blue-50 rounded-xl p-3 mr-3">
                      <Ionicons
                        name={getAnnouncementIcon(announcement.type)}
                        size={24}
                        color="#3B82F6"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-base font-bold leading-5 mb-1">
                        {announcement.title}
                      </Text>
                      <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                        {announcement.type}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text className="text-gray-700 text-sm leading-6 mb-4">
                    {announcement.description}
                  </Text>

                  {/* Details */}
                  <View className="bg-gray-50 rounded-xl p-3 gap-2.5">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text className="text-gray-700 text-sm ml-2 font-medium">
                        {announcement.date}
                      </Text>
                    </View>
                    
                    {announcement.time && (
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-700 text-sm ml-2 font-medium">
                          {announcement.time}
                        </Text>
                      </View>
                    )}
                    
                    {announcement.location && (
                      <View className="flex-row items-center">
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-700 text-sm ml-2 font-medium">
                          {announcement.location}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Submit Complaint Button */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8">
        <TouchableOpacity
          onPress={handleSubmitComplaint}
          activeOpacity={0.8}
          className="bg-blue-600 flex-row items-center justify-center px-6 py-4 rounded-full shadow-xl"
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="chatbox-ellipses" size={22} color="white" />
          <Text className="text-white text-base font-bold ml-2">
            Submit a Complaint
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
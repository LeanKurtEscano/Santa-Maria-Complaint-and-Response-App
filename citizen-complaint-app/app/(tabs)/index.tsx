import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Static announcement data
const announcements = [
  {
    id: '1',
    title: 'Barangay Assembly Meeting',
    description: 'All residents are invited to attend the monthly barangay assembly. Discuss community concerns and upcoming projects.',
    date: 'February 20, 2026',
    time: '2:00 PM',
    location: 'Barangay Hall',
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
    description: 'Scheduled water maintenance will be conducted in Sitio 1 and Sitio 2. Please store water in advance.',
    date: 'February 18, 2026',
    time: '8:00 AM - 5:00 PM',
    location: 'Sitio 1 & 2',
    type: 'notice',
    isUrgent: true,
  },
  {
    id: '4',
    title: 'Senior Citizen Cash Assistance',
    description: 'Distribution of quarterly cash assistance for senior citizens. Please bring valid ID and claim stub.',
    date: 'February 25-28, 2026',
    time: '9:00 AM - 4:00 PM',
    location: 'Barangay Hall',
    type: 'program',
    isUrgent: false,
  },
  {
    id: '5',
    title: 'COVID-19 Vaccination Drive',
    description: 'Free booster shots available for all eligible residents. Walk-in vaccinations welcome.',
    date: 'February 22, 2026',
    time: '8:00 AM - 2:00 PM',
    location: 'Barangay Health Center',
    type: 'health',
    isUrgent: false,
  },
];

export default function HomeScreen() {
  const handleSubmitComplaint = () => {
    // You will add your navigation here
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-8 bg-blue-600">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-2xl font-bold">
                Santa Maria
              </Text>
              <Text className="text-blue-100 text-base">
                Laguna, Philippines
              </Text>
            </View>
            <View className="bg-white/20 rounded-full p-3">
              <Ionicons name="notifications-outline" size={24} color="white" />
            </View>
          </View>

          <View className="bg-white/10 rounded-xl p-4 border border-white/20">
            <Text className="text-white text-sm font-medium mb-1">
              Welcome to
            </Text>
            <Text className="text-white text-xl font-bold">
              Barangay Government Portal
            </Text>
          </View>
        </View>

        {/* Announcements Section */}
        <View className="px-6 py-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons name="megaphone" size={24} color="#3B82F6" />
              <Text className="text-gray-800 text-xl font-bold ml-2">
                Announcements
              </Text>
            </View>
            <TouchableOpacity>
              <Text className="text-blue-600 text-sm font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Announcement Cards */}
          <View className="space-y-4">
            {announcements.map((announcement) => (
              <TouchableOpacity
                key={announcement.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100"
                activeOpacity={0.7}
              >
                <View className="p-4">
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-blue-50 rounded-full p-2 mr-3">
                        <Ionicons
                          name={getAnnouncementIcon(announcement.type)}
                          size={20}
                          color="#3B82F6"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 text-base font-bold">
                          {announcement.title}
                        </Text>
                        {announcement.isUrgent && (
                          <View className="bg-red-50 self-start px-2 py-1 rounded mt-1">
                            <Text className="text-red-600 text-xs font-semibold">
                              URGENT
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <Text className="text-gray-600 text-sm leading-5 mb-3">
                    {announcement.description}
                  </Text>

                  {/* Details */}
                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-2">
                        {announcement.date}
                      </Text>
                    </View>
                    
                    {announcement.time && (
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-600 text-sm ml-2">
                          {announcement.time}
                        </Text>
                      </View>
                    )}
                    
                    {announcement.location && (
                      <View className="flex-row items-center">
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-600 text-sm ml-2">
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

        {/* Bottom spacing for the floating button */}
        <View className="h-24" />
      </ScrollView>

      {/* Floating Submit Complaint Button */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-6">
        <TouchableOpacity
          onPress={handleSubmitComplaint}
          activeOpacity={0.8}
          className="bg-blue-600 flex-row items-center justify-center px-6 py-4 rounded-full shadow-lg"
        >
          <Ionicons name="chatbox-ellipses" size={24} color="white" />
          <Text className="text-white text-base font-bold ml-2">
            Submit a Complaint
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
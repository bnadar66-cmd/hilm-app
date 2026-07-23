import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme/theme';
import HomeScreen from '../screens/HomeScreen';
import MyCoursesScreen from '../screens/MyCoursesScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import LectureScreen from '../screens/LectureScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = {
  Home: 'home-outline',
  MyCourses: 'book-outline',
  Explore: 'compass-outline',
  Profile: 'person-outline',
};

const LABELS = {
  Home: 'الرئيسية',
  MyCourses: 'دوراتي',
  Explore: 'استكشف',
  Profile: 'حسابي',
};

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 11 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size ?? 22} color={color} />
        ),
        tabBarLabel: LABELS[route.name],
      })}
    >
      {/* الترتيب معكوس عمدًا عشان "الرئيسية" تطلع أقصى اليمين بشريط RTL */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="MyCourses" component={MyCoursesScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
    </Tab.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={Tabs} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Lecture" component={LectureScreen} />
    </Stack.Navigator>
  );
}

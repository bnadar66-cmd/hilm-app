import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import StaffCoursesScreen from '../screens/StaffCoursesScreen';
import StaffStudentsScreen from '../screens/StaffStudentsScreen';
import StaffProfileScreen from '../screens/StaffProfileScreen';
import TeamManageScreen from '../screens/TeamManageScreen';
import StaffCourseManageScreen from '../screens/StaffCourseManageScreen';
import StaffLectureManageScreen from '../screens/StaffLectureManageScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = {
  StaffCourses: 'library-outline',
  StaffStudents: 'people-outline',
  TeamManage: 'briefcase-outline',
  StaffProfile: 'person-outline',
};

const LABELS = {
  StaffCourses: 'الدورات',
  StaffStudents: 'الطلاب',
  TeamManage: 'الفريق',
  StaffProfile: 'حسابي',
};

function Tabs() {
  const { isAdmin } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="StaffCourses"
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
      <Tab.Screen name="StaffProfile" component={StaffProfileScreen} />
      {isAdmin && <Tab.Screen name="TeamManage" component={TeamManageScreen} />}
      <Tab.Screen name="StaffStudents" component={StaffStudentsScreen} />
      <Tab.Screen name="StaffCourses" component={StaffCoursesScreen} />
    </Tab.Navigator>
  );
}

export default function StaffNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StaffTabs" component={Tabs} />
      <Stack.Screen name="StaffCourseManage" component={StaffCourseManageScreen} />
      <Stack.Screen name="StaffLectureManage" component={StaffLectureManageScreen} />
    </Stack.Navigator>
  );
}

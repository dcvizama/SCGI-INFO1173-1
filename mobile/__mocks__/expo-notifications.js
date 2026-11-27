export const AndroidImportance = { HIGH: 4 };
export const setNotificationChannelAsync = jest.fn(async () => {});
export const getPermissionsAsync = jest.fn(async () => ({ granted: false, canAskAgain: false }));
export const requestPermissionsAsync = jest.fn();
export const getExpoPushTokenAsync = jest.fn();
export const getLastNotificationResponse = jest.fn();
export const clearLastNotificationResponse = jest.fn();
export const addNotificationReceivedListener = jest.fn(() => ({ remove: jest.fn() }));
export const addNotificationResponseReceivedListener = jest.fn(() => ({ remove: jest.fn() }));

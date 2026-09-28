const WEATHER_TIMEZONE = 'Europe/Amsterdam';
const WEATHER_DAY = '2026-06-15';
const WEATHER_CLOCK = Date.UTC(2026, 5, 15, 12, 30);

const smtp = () => {
	return {
		encryption: '',
		address: 'smtp.example.com',
		port: '587',
		username: 'alerts@example.com',
		password: 'm5Tq8Wn2Hc6Jr4Lx',
		sender: 'alerts@example.com',
		recipients: ['it@example.com', 'olivia@example.com']
	};
};

const location = () => {
	return { latitude: '52.3676', longitude: '4.9041' };
};

const hourlyTime = () => {
	return Array.from({ length: 48 }, (_, hour) => {
		const day = (hour < 24 ? WEATHER_DAY : '2026-06-16');
		return `${day}T${String(hour % 24).padStart(2, '0')}:00`;
	});
};

const weather = () => {
	const temperatures = Array.from({ length: 48 }, (_, hour) => {
		const dayHour = hour % 24;
		return Math.round((17 + 6 * Math.sin((dayHour - 9) / 24 * 2 * Math.PI)) * 10) / 10;
	});
	const precipitation = Array.from({ length: 48 }, (_, hour) => {
		const dayHour = hour % 24;
		return (dayHour >= 18 && dayHour <= 21 ? 45 : 5);
	});
	return {
		latitude: 52.37,
		longitude: 4.9,
		timezone: WEATHER_TIMEZONE,
		current_weather_units: { temperature: '°C' },
		current_weather: { time: `${WEATHER_DAY}T14:30`, temperature: 22.4, weathercode: 2, is_day: 1 },
		hourly: { time: hourlyTime(), temperature_2m: temperatures, precipitation_probability: precipitation },
		daily: { sunrise: [`${WEATHER_DAY}T05:18`], sunset: [`${WEATHER_DAY}T22:05`] }
	};
};

export {
	WEATHER_CLOCK,
	smtp,
	location,
	weather
};

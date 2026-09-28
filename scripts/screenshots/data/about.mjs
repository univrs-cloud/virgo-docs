const HARDWARE = {
	serial: '10000000c0ffee42',
	cpu: { cores: 4, vendor: 'ARM', family: 'Cortex-A76', speedMax: 2.8 }
};

const SOFTWARE = {
	kernel: '6.18.50+rpt-rpi-2712',
	zfs: '2.4.4-1~bpo13+1'
};

const system = (apiVersion) => {
	return {
		api: { version: apiVersion },
		zfs: { version: SOFTWARE.zfs },
		serial: HARDWARE.serial,
		cpu: HARDWARE.cpu
	};
};

export {
	SOFTWARE,
	system
};

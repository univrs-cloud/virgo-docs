const HARDWARE = {
	serial: '10000000c0ffee42',
	cpu: { cores: 4, vendor: 'ARM', family: 'Cortex-A76', speedMax: 2.4 }
};

const SOFTWARE = {
	kernel: '6.12.47+rpt-rpi-2712',
	zfs: '2.3.2'
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

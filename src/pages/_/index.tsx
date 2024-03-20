import BackendsGrid from './components/BackendsGrid';
import CalibrationsGrid from './components/CalibrationsGrid';
import MLExperimentsGrid from './components/MLExperimentsGrid';
import Hero from './components/Hero';

const Home = () => {
	return (
		<>
			<Hero />
			<BackendsGrid title='Devices' />
			<CalibrationsGrid title='Tune-up' />
			<MLExperimentsGrid title='ML Classification Runs' />
		</>
	);
};

export default Home;

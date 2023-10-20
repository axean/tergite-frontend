import { oauth2Providers } from '@/constants';
import Oauth2LoginBtn from './components/Oauth2LoginBtn';

export default function Login() {
	return (
		<div className='flex flex-col gap-2 mx-auto my-auto'>
			{oauth2Providers.map(({ name, logo }) => (
				<Oauth2LoginBtn key={name} provider={name} logo={logo} />
			))}
		</div>
	);
}

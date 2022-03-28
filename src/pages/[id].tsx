import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { MdFirstPage, MdLastPage } from 'react-icons/md';
const Detail = () => {
	const router = useRouter();
	const id = router.query.id;
	const [collapsed, setCollapsed] = useState(false);
	return (
		<Flex flex='1' py='8' w='full' id='deailId'>
			<Flex gap='8' flex='1'>
				{!collapsed && (
					<Box bg='white' flex='2' p='2' borderRadius='md' boxShadow='lg'>
						<Flex justifyContent='space-between'>
							<Text fontSize='2xl' color='black'>
								Chalmers Luki
							</Text>
							<Button p='2' onClick={() => setCollapsed(!collapsed)}>
								<Icon as={MdFirstPage} w={8} h={8} />
							</Button>
						</Flex>
						<Text fontSize='4xl' color='black'>
							description
						</Text>
					</Box>
				)}

				<Box bg='white' flex='5' p='4' borderRadius='md' boxShadow='lg'>
					{collapsed && (
						<Button p='2' onClick={() => setCollapsed(!collapsed)}>
							<Icon as={MdLastPage} w={8} h={8} />
						</Button>
					)}
					<Text fontSize='4xl' color='black'>
						charts
					</Text>
				</Box>
			</Flex>
		</Flex>
	);
};

export default Detail;

import { MoreVertical, Plus, QrCode, Users } from 'lucide-react'
import { useState } from 'react'
import { cn } from '#/lib/utils'
import { Badge } from '#/shared/ui/Badge'
import { Button } from '#/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '#/shared/ui/Card'
import { Modal } from '#/shared/ui/Modal'

interface Table {
	id: number
	name: string
	capacity: number
	status: 'free' | 'occupied'
}

export function AdminTablesContent() {
	const [isQrModalOpen, setIsQrModalOpen] = useState(false)
	const [selectedTable, setSelectedTable] = useState<Table | null>(null)

	const tables: Table[] = [
		{ id: 1, name: 'Table 1', capacity: 2, status: 'free' },
		{ id: 2, name: 'Table 2', capacity: 4, status: 'occupied' },
		{ id: 3, name: 'Table 3', capacity: 4, status: 'free' },
		{ id: 4, name: 'Table 4', capacity: 6, status: 'occupied' },
		{ id: 5, name: 'Table 5', capacity: 2, status: 'free' },
		{ id: 6, name: 'Table 6', capacity: 4, status: 'free' },
		{ id: 7, name: 'Table 7', capacity: 8, status: 'occupied' },
		{ id: 8, name: 'Table 8', capacity: 2, status: 'free' },
	]

	const handleOpenQr = (table: Table) => {
		setSelectedTable(table)
		setIsQrModalOpen(true)
	}

	return (
		<div className='space-y-8'>
			<div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-extrabold'>Tables</h1>
					<p className='text-[var(--sea-ink-soft)]'>Monitor table status and manage QR codes.</p>
				</div>
				<Button size='sm' className='rounded-full'>
					<Plus className='mr-2 h-4 w-4' /> Add Table
				</Button>
			</div>

			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
				{tables.map((table) => (
					<Card key={table.id} className='overflow-hidden transition-all hover:shadow-md'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-lg font-bold'>{table.name}</CardTitle>
							<Badge variant={table.status === 'free' ? 'success' : 'warning'} className='capitalize'>
								{table.status}
							</Badge>
						</CardHeader>
						<CardContent>
							<div className='mb-6 flex items-center gap-2 text-[var(--sea-ink-soft)]'>
								<Users className='h-4 w-4' />
								<span className='text-sm font-medium'>Capacity: {table.capacity} guests</span>
							</div>
							<div className='flex gap-2'>
								<Button
									variant='outline'
									size='sm'
									className='flex-1 rounded-xl'
									onClick={() => handleOpenQr(table)}
								>
									<QrCode className='mr-2 h-4 w-4' /> QR Code
								</Button>
								<Button variant='ghost' size='icon' className='rounded-xl border border-[var(--line)]'>
									<MoreVertical className='h-4 w-4' />
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Modal
				isOpen={isQrModalOpen}
				onClose={() => setIsQrModalOpen(false)}
				title={`QR Code for ${selectedTable?.name}`}
				footer={
					<Button onClick={() => setIsQrModalOpen(false)} className='rounded-full'>
						Download PNG
					</Button>
				}
			>
				<div className='flex flex-col items-center justify-center space-y-6 py-4'>
					<div className='flex h-64 w-64 items-center justify-center rounded-[2rem] border-4 border-[var(--brand-magenta)] bg-white p-6 shadow-xl'>
						<div className='grid h-full w-full grid-cols-5 gap-1'>
							{Array.from({ length: 25 }).map((_, i) => (
								<div
									key={i}
									className={cn(
										'rounded-sm',
										Math.random() > 0.4 ? 'bg-black' : 'bg-transparent',
									)}
								/>
							))}
						</div>
					</div>
					<p className='text-center text-sm text-[var(--sea-ink-soft)]'>
						Scanning this code will redirect customers directly to the digital menu for{' '}
						<strong>{selectedTable?.name}</strong>.
					</p>
				</div>
			</Modal>
		</div>
	)
}

import { Edit2, Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '#/lib/utils'
import { Badge } from '#/shared/ui/Badge'
import { Button } from '#/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '#/shared/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/shared/ui/Table'

export function AdminMenuContent() {
	const [activeCategory, setActiveCategory] = useState('All')

	const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Drinks']

	const [menuItems, setMenuItems] = useState([
		{ id: 1, name: 'Truffle Pasta', category: 'Main Course', price: 24.5, available: true },
		{ id: 2, name: 'Crispy Calamari', category: 'Starters', price: 12.0, available: true },
		{ id: 3, name: 'Margherita Pizza', category: 'Main Course', price: 18.0, available: false },
		{ id: 4, name: 'Chocolate Lava Cake', category: 'Desserts', price: 9.5, available: true },
		{ id: 5, name: 'Iced Latte', category: 'Drinks', price: 5.5, available: true },
	])

	const filteredItems =
		activeCategory === 'All'
			? menuItems
			: menuItems.filter((item) => item.category === activeCategory)

	const toggleAvailability = (id: number) => {
		setMenuItems((items) =>
			items.map((item) => (item.id === id ? { ...item, available: !item.available } : item)),
		)
	}

	return (
		<div className='space-y-8'>
			<div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-extrabold'>Menu Management</h1>
					<p className='text-[var(--sea-ink-soft)]'>
						Create and organize your digital menu categories and products.
					</p>
				</div>
				<div className='flex items-center gap-3'>
					<Button variant='outline' size='sm' className='rounded-full'>
						Manage Categories
					</Button>
					<Button size='sm' className='rounded-full'>
						<Plus className='mr-2 h-4 w-4' /> Add Product
					</Button>
				</div>
			</div>

			<div className='flex flex-col gap-6 lg:flex-row'>
				<Card className='h-fit w-full lg:w-64'>
					<CardHeader>
						<CardTitle className='text-sm font-bold uppercase tracking-wider text-[var(--sea-ink-soft)]'>
							Categories
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-1 p-2 pt-0'>
						{categories.map((cat) => (
							<button
								type='button'
								key={cat}
								onClick={() => setActiveCategory(cat)}
								className={cn(
									'w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all',
									activeCategory === cat
										? 'bg-[var(--accent-soft)] text-[var(--brand-magenta)]'
										: 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]',
								)}
							>
								{cat}
							</button>
						))}
					</CardContent>
				</Card>

				<Card className='flex-1 overflow-hidden'>
					<CardHeader className='border-b border-[var(--line)]'>
						<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
							<CardTitle>Products in {activeCategory}</CardTitle>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sea-ink-soft)]' />
								<input
									type='text'
									placeholder='Search products...'
									className='h-10 w-full rounded-full border border-[var(--line)] bg-[var(--bg-base)] pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-magenta)] sm:w-64'
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent className='p-0'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='pl-8'>Product Name</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Price</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className='pr-8 text-right'>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredItems.map((item) => (
									<TableRow key={item.id}>
										<TableCell className='pl-8 font-bold'>{item.name}</TableCell>
										<TableCell>{item.category}</TableCell>
										<TableCell className='font-mono'>${item.price.toFixed(2)}</TableCell>
										<TableCell>
											<Badge variant={item.available ? 'success' : 'outline'} className='gap-1.5'>
												<div
													className={cn(
														'h-1.5 w-1.5 rounded-full',
														item.available ? 'bg-emerald-500' : 'bg-gray-400',
													)}
												/>
												{item.available ? 'Available' : 'Hidden'}
											</Badge>
										</TableCell>
										<TableCell className='pr-8 text-right'>
											<div className='flex justify-end gap-1'>
												<Button
													variant='ghost'
													size='icon'
													className='rounded-full'
													onClick={() => toggleAvailability(item.id)}
												>
													{item.available ? (
														<Eye className='h-4 w-4' />
													) : (
														<EyeOff className='h-4 w-4 text-gray-400' />
													)}
												</Button>
												<Button variant='ghost' size='icon' className='rounded-full'>
													<Edit2 className='h-4 w-4' />
												</Button>
												<Button
													variant='ghost'
													size='icon'
													className='rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-600'
												>
													<Trash2 className='h-4 w-4' />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

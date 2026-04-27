import { CreditCard, DollarSign, Landmark, MapPin, Save, Settings, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { cn } from '#/lib/utils'
import { Button } from '#/shared/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/Card'

export function AdminSettingsContent() {
	const [paymentMethods, setPaymentMethods] = useState({
		cash: true,
		pos: true,
		online: false,
	})

	return (
		<div className='space-y-8'>
			<div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-extrabold'>Settings</h1>
					<p className='text-[var(--sea-ink-soft)]'>
						Configure your restaurant profile and payment systems.
					</p>
				</div>
				<Button size='sm' className='rounded-full'>
					<Save className='mr-2 h-4 w-4' /> Save Changes
				</Button>
			</div>

			<div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<div className='flex items-center gap-3'>
							<div className='rounded-xl bg-[var(--accent-soft)] p-2 text-[var(--brand-magenta)]'>
								<Settings className='h-5 w-5' />
							</div>
							<div>
								<CardTitle>Business Information</CardTitle>
								<CardDescription>
									Update your restaurant details displayed on customer menus.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='space-y-2'>
							<label className='text-sm font-bold text-[var(--sea-ink-soft)]'>Restaurant Name</label>
							<input
								type='text'
								defaultValue='ServeOS Kitchen'
								className='h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-base)] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-magenta)]'
							/>
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-bold text-[var(--sea-ink-soft)]'>Address</label>
							<div className='relative'>
								<MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sea-ink-soft)]' />
								<input
									type='text'
									defaultValue='123 Gourmet St, Foodie City'
									className='h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-base)] pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-magenta)]'
								/>
							</div>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<label className='text-sm font-bold text-[var(--sea-ink-soft)]'>Currency</label>
								<div className='relative'>
									<DollarSign className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sea-ink-soft)]' />
									<select className='h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-base)] pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-magenta)] appearance-none'>
										<option>USD ($)</option>
										<option>EUR (€)</option>
										<option>GBP (£)</option>
									</select>
								</div>
							</div>
							<div className='space-y-2'>
								<label className='text-sm font-bold text-[var(--sea-ink-soft)]'>Language</label>
								<select className='h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-base)] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-magenta)] appearance-none'>
									<option>English</option>
									<option>Spanish</option>
									<option>French</option>
								</select>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className='flex items-center gap-3'>
							<div className='rounded-xl bg-emerald-500/10 p-2 text-emerald-600'>
								<CreditCard className='h-5 w-5' />
							</div>
							<div>
								<CardTitle>Payment Methods</CardTitle>
								<CardDescription>
									Configure which payment options are available to your customers.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className='space-y-6'>
						{[
							{
								id: 'cash',
								label: 'Cash Payments',
								icon: Landmark,
								desc: 'Waiters confirm physical cash handling.',
							},
							{
								id: 'pos',
								label: 'POS Terminal',
								icon: Smartphone,
								desc: 'External card terminal integration.',
							},
							{
								id: 'online',
								label: 'Online Payments',
								icon: CreditCard,
								desc: 'Stripe/Direct bank transfer support.',
							},
						].map((method) => (
							<div
								key={method.id}
								className='flex items-center justify-between rounded-2xl border border-[var(--line)] p-4 transition hover:bg-[var(--link-bg-hover)]'
							>
								<div className='flex items-center gap-4'>
									<div className='rounded-xl bg-[var(--accent-soft)] p-2.5 text-[var(--brand-magenta)]'>
										<method.icon className='h-5 w-5' />
									</div>
									<div>
										<h4 className='font-bold'>{method.label}</h4>
										<p className='text-xs text-[var(--sea-ink-soft)]'>{method.desc}</p>
									</div>
								</div>
								<button
									onClick={() =>
										setPaymentMethods((prev) => ({
											...prev,
											[method.id]: !prev[method.id as keyof typeof prev],
										}))
									}
									className={cn(
										'relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-magenta)] focus:ring-offset-2',
										paymentMethods[method.id as keyof typeof paymentMethods]
											? 'bg-[var(--brand-magenta)]'
											: 'bg-gray-200',
									)}
								>
									<span
										className={cn(
											'absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform',
											paymentMethods[method.id as keyof typeof paymentMethods]
												? 'translate-x-5'
												: 'translate-x-0',
										)}
									/>
								</button>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

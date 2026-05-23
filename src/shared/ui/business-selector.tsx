import { useQuery } from '@tanstack/react-query'
import { Button } from '#/components/ui/button'
import { listBusinessesServerFn } from '#/shared/api/business/business.fns.ts'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'
import { Modal } from '#/shared/ui/Modal'

export function BusinessSelector({
  isOpen,
  onClose,
}: Readonly<{ isOpen: boolean; onClose: () => void }>) {
  const setActive = useActiveBusinessStore((s) => s.setActive)

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: listBusinessesServerFn,
    enabled: isOpen,
  })

  const onSelect = (id: string) => {
    const business = businesses.find((b) => b.id === id) ?? null
    setActive(business)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Select a business'>
      <div>
        {isLoading && <div>Loading...</div>}

        {!isLoading && businesses.length === 0 && <div>No businesses found</div>}

        <div className='grid gap-2'>
          {businesses.map((b) => (
            <Button key={b.id} onClick={() => onSelect(b.id)}>
              {b.name}
            </Button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

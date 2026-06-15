import { zodResolver } from '@hookform/resolvers/zod'
import { useRouteContext } from '@tanstack/react-router'
import { KeyRound, Save, User } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import {
  type ChangePasswordFormValues,
  changePasswordSchema,
} from '#/features/users/lib/schemas/change-password.schema'
import {
  type UpdateProfileFormValues,
  updateProfileSchema,
} from '#/features/users/lib/schemas/update-profile.schema'
import {
  useChangePasswordMutation,
  useUpdateProfileMutation,
} from '#/features/users/model/users-hooks'
import { ImageEntityType } from '#/shared/api/images/images.api'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'
import { ImageUpload } from '#/shared/ui/image-upload'

export function UserSettingsContent() {
  const { authUser } = useRouteContext({ from: '/_admin' })

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const firstNameId = useId()
  const lastNameId = useId()
  const emailId = useId()
  const currentPasswordId = useId()
  const newPasswordId = useId()
  const confirmPasswordId = useId()

  const updateProfileMutation = useUpdateProfileMutation()
  const changePasswordMutation = useChangePasswordMutation()

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: '', lastName: '', email: '' },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (authUser?.type !== 'owner') return
    resetProfile({
      firstName: authUser.firstName ?? '',
      lastName: authUser.lastName ?? '',
      email: authUser.email ?? '',
    })
    setAvatarUrl(authUser.avatarUrl ?? null)
  }, [authUser, resetProfile])

  const onProfileSubmit = async (values: UpdateProfileFormValues) => {
    try {
      await updateProfileMutation.mutateAsync({ ...values, avatarUrl })
      showSuccess('Profile updated')
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onPasswordSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      showSuccess('Password changed')
      resetPassword()
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  if (authUser?.type !== 'owner') {
    return (
      <div className='space-y-4'>
        <h1 className='text-3xl font-semibold tracking-tight'>Account Settings</h1>
        <p className='text-muted-foreground'>Account settings are only available for owners.</p>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-semibold tracking-tight'>Account Settings</h1>
        <p className='text-muted-foreground'>Manage your personal profile and security settings.</p>
      </div>

      <div className='flex flex-col gap-4 lg:flex-row'>
        {/* Profile */}
        <Card className='flex-1'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-accent p-2 text-accent-foreground'>
                <User className='h-5 w-5' />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your name and email address.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className='space-y-4'
              onSubmit={(e) => {
                e.preventDefault()
                void handleProfileSubmit(onProfileSubmit)()
              }}
            >
              <ImageUpload
                value={avatarUrl}
                onChange={setAvatarUrl}
                entityType={ImageEntityType.USER_AVATAR}
                label='Profile photo'
                previewShape='circle'
              />
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label
                    htmlFor={firstNameId}
                    className='text-sm font-medium text-muted-foreground'
                  >
                    First Name
                  </label>
                  <input
                    id={firstNameId}
                    type='text'
                    className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    {...registerProfile('firstName')}
                  />
                  {profileErrors.firstName && (
                    <p className='text-xs text-red-600'>{profileErrors.firstName.message}</p>
                  )}
                </div>
                <div className='space-y-2'>
                  <label htmlFor={lastNameId} className='text-sm font-medium text-muted-foreground'>
                    Last Name
                  </label>
                  <input
                    id={lastNameId}
                    type='text'
                    className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    {...registerProfile('lastName')}
                  />
                  {profileErrors.lastName && (
                    <p className='text-xs text-red-600'>{profileErrors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className='space-y-2'>
                <label htmlFor={emailId} className='text-sm font-medium text-muted-foreground'>
                  Email Address
                </label>
                <input
                  id={emailId}
                  type='email'
                  className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  {...registerProfile('email')}
                />
                {profileErrors.email && (
                  <p className='text-xs text-red-600'>{profileErrors.email.message}</p>
                )}
              </div>
              <Button
                type='submit'
                size='sm'
                className='rounded-full'
                disabled={updateProfileMutation.isPending}
              >
                <Save className='mr-2 h-4 w-4' />
                {updateProfileMutation.isPending ? 'Saving…' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className='flex-1'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-accent p-2 text-accent-foreground'>
                <KeyRound className='h-5 w-5' />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Use a strong password you don't use elsewhere.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className='space-y-4'
              onSubmit={(e) => {
                e.preventDefault()
                void handlePasswordSubmit(onPasswordSubmit)()
              }}
            >
              <div className='space-y-2'>
                <label
                  htmlFor={currentPasswordId}
                  className='text-sm font-medium text-muted-foreground'
                >
                  Current Password
                </label>
                <input
                  id={currentPasswordId}
                  type='password'
                  autoComplete='current-password'
                  className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  {...registerPassword('currentPassword')}
                />
                {passwordErrors.currentPassword && (
                  <p className='text-xs text-red-600'>{passwordErrors.currentPassword.message}</p>
                )}
              </div>
              <div className='space-y-2'>
                <label
                  htmlFor={newPasswordId}
                  className='text-sm font-medium text-muted-foreground'
                >
                  New Password
                </label>
                <input
                  id={newPasswordId}
                  type='password'
                  autoComplete='new-password'
                  className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  {...registerPassword('newPassword')}
                />
                {passwordErrors.newPassword && (
                  <p className='text-xs text-red-600'>{passwordErrors.newPassword.message}</p>
                )}
              </div>
              <div className='space-y-2'>
                <label
                  htmlFor={confirmPasswordId}
                  className='text-sm font-medium text-muted-foreground'
                >
                  Confirm New Password
                </label>
                <input
                  id={confirmPasswordId}
                  type='password'
                  autoComplete='new-password'
                  className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  {...registerPassword('confirmPassword')}
                />
                {passwordErrors.confirmPassword && (
                  <p className='text-xs text-red-600'>{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
              <Button
                type='submit'
                size='sm'
                className='rounded-full'
                disabled={changePasswordMutation.isPending}
              >
                <KeyRound className='mr-2 h-4 w-4' />
                {changePasswordMutation.isPending ? 'Changing…' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

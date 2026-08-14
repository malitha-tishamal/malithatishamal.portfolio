import { Configuration } from './Configuration'
import { DocNavigation } from './DocNavigation'
import { Introduction } from './Introduction'
import { PackageStructure } from './PackageStructure'
import { QuickStart } from './QuickStart'

export const Documentation = () => {
  return (
    <div className='dark:bg-darklight pt-2'>
      <div className='container mx-auto max-w-6xl p-6 lg:mt-16 mt-16 pt-10!'>
        <div className='grid grid-cols-12 gap-6'>
          <div className='lg:col-span-3 col-span-12 lg:block hidden'>
            <DocNavigation />
          </div>
          <div className='lg:col-span-9 col-span-12'>
            <Introduction />
            <PackageStructure />
            <QuickStart />
            <Configuration />
          </div>
        </div>
      </div>
    </div>
  )
}

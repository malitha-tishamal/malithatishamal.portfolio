export const ColorConfiguration = () => {
  return (
    <>
      <h3 className=' text-black text-xl font-semibold mt-8 dark:text-white'>
        Colors
      </h3>
      <div className='p-6 rounded-md border mt-4 border-border dark:border-dark_border'>
        <p className='text-base font-medium text-midnight_text dark:text-white/50'>
          <span className='font-semibold text-lg dark:text-white'>
            1. Override Colors
          </span>{' '}
          <br />
          For any change in colors : src/utils/extendedConfig.ts
        </p>
        <div className='py-4 px-5 rounded-md bg-black mt-8'>
          <p className='text-sm text-gray-400 flex flex-col gap-2'>
            <span>--color-primary: #2f73f2;</span>
            <span>--color-secondary: #547593;</span>
            <span>--color-midnight_text: #102d47;</span>
            <span>--color-grey: #668199;</span>
            <span>--color-border: #ccd7e1;</span>
            <span>--color-success: #3cd278;</span>
            <span>--color-section: #f8fafc;</span>
            <span>--color-darkmode: #081738;</span>
            <span>--color-darklight: #000f30;</span>
            <span>--color-dark_border: #224767;</span>
            <span>--color-Sky-blue-mist: #c0d5fb;</span>
          </p>
        </div>
      </div>
      <div className='p-6 rounded-md border mt-4 border-border dark:border-dark_border'>
        <p className='text-base font-medium text-midnight_text dark:text-white/50'>
          <span className='font-semibold text-lg dark:text-white'>
            2. Override Theme Colors
          </span>{' '}
          <br />
          For change , go to : src/utils/extendedConfig.ts
        </p>
        <div className='py-4 px-5 rounded-md bg-black mt-8'>
          <p className='text-sm text-gray-400 flex flex-col gap-2'>
            <span>primary: "#2F73F2",</span>
            <span>secondary: "#547593",</span>
          </p>
        </div>
      </div>
    </>
  )
}

import localFont from 'next/font/local'

const biotif = localFont({
  declarations: [{ prop: 'descent-override', value: '0%' }],
  src: [
    // public/public/font/Biotif-Black.ttf public/fonts/Biotif-BlackItalic.ttf public/fonts/Biotif-Bold.ttf public/fonts/Biotif-BoldItalic.ttf public/fonts/Biotif-Book.ttf public/fonts/Biotif-BookItalic.ttf public/fonts/Biotif-ExtraBold.ttf public/fonts/Biotif-ExtraBoldItalic.ttf public/fonts/Biotif-Light.ttf public/fonts/Biotif-LightItalic.ttf public/fonts/Biotif-Medium.ttf public/fonts/Biotif-MediumItalic.ttf public/fonts/Biotif-Regular.ttf public/fonts/Biotif-RegularItalic.ttf public/fonts/Biotif-SemiBold.ttf public/fonts/Biotif-SemiBoldItalic.ttf
    {
      path: '../../public/fonts/Biotif-Regular.ttf',
      style: 'normal',
      weight: '400',
    },
    {
      path: '../../public/fonts/Biotif-RegularItalic.ttf',
      style: 'italic',
      weight: '400',
    },
    {
      path: '../../public/fonts/Biotif-Bold.ttf',
      style: 'normal',
      weight: '700',
    },
    {
      path: '../../public/fonts/Biotif-BoldItalic.ttf',
      style: 'italic',
      weight: '700',
    },
    {
      path: '../../public/fonts/Biotif-Black.ttf',
      style: 'normal',
      weight: '900',
    },
    {
      path: '../../public/fonts/Biotif-BlackItalic.ttf',
      style: 'italic',
      weight: '900',
    },
    {
      path: '../../public/fonts/Biotif-ExtraBold.ttf',
      style: 'normal',
      weight: '800',
    },
    {
      path: '../../public/fonts/Biotif-ExtraBoldItalic.ttf',
      style: 'italic',
      weight: '800',
    },
    {
      path: '../../public/fonts/Biotif-Light.ttf',
      style: 'normal',
      weight: '300',
    },
    {
      path: '../../public/fonts/Biotif-LightItalic.ttf',
      style: 'italic',
      weight: '300',
    },
    {
      path: '../../public/fonts/Biotif-Medium.ttf',
      style: 'normal',
      weight: '500',
    },
    {
      path: '../../public/fonts/Biotif-MediumItalic.ttf',
      style: 'italic',
      weight: '500',
    },
    {
      path: '../../public/fonts/Biotif-SemiBold.ttf',
      style: 'normal',
      weight: '600',
    },
    {
      path: '../../public/fonts/Biotif-SemiBoldItalic.ttf',
      style: 'italic',
      weight: '600',
    },
  ],
})

export default biotif

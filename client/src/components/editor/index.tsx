import { useCallback, useEffect, useRef } from 'react';
import Quill from 'quill';
// quill snow theme
import 'quill/dist/quill.snow.css';

const TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline', 'strike'], // toggled buttons
  ['blockquote', 'code-block'],

  // [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: 'ordered' }, { list: 'bullet' }],

  [{ script: 'sub' }, { script: 'super' }], // superscript/subscript

  [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
  // [{ direction: 'rtl' }], // text direction

  // [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],
  ['image'], // insert images
  ['video'], // insert video
  ['link'],
  // ['table'], // table in toolbar

  ['clean'], // remove formatting button
];

const Editor = ({ content }: EditorProps) => {
  const quillRef = useCallback((wrapperEl: HTMLDivElement) => {
    // not visible on the page
    if (wrapperEl === null) {
      return;
    }

    // clean up toolbars for every component's rendering
    wrapperEl.innerHTML = '';

    // quill's toolbar inside of `____quill-wrapper`
    const div = document.createElement('div');
    wrapperEl.append(div);
    const editor = new Quill(div, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    const buttons = document.querySelectorAll(
      '.____quill-wrapper > .ql-toolbar button',
    );
    buttons.forEach((button) => {
      button.setAttribute('data-toggle', 'tooltip');
      button.setAttribute('title', 'tooltip');
      // @ts-ignore
      // $(button).tooltip();
    });
  }, []);

  // actually, a ref can accept a function with sigature above
  return <div className='____quill-wrapper' ref={quillRef}></div>;
};

/*
const Editor = ({ content }: EditorProps) => {
  const quillRef = useRef(null);
  useEffect(() => {
    // we want to wrap all element created by quill inside `quill-wrapper`
    // to make it easy to manage later

    const div = document.createElement('div');

    // @ts-ignore
    quillRef.current.append(div);

    const editor = new Quill(div, { theme: 'snow' });

    // clear toolbar when component unmount
    return () => {};
    // WHEN THE COMPONENT GET UNMOUTED, SOMETIMES, WE CAN'T GET THE quillRef HERE, THAT CAUSES THE CLEANUP NOT COMPLETED, SO WE WILL HAVE MULTIPLE TOOLBARS DURING RELOADING PAGE WHEN THE SOURCE CODE CHANGED
    
  }, []);

  return <div className='quill-wrapper' ref={quillRef}></div>;
};
*/

export default Editor;
export interface EditorProps {
  content?: string;
}

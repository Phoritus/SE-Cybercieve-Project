import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import  FileScan  from '@/src/pages/FileScan';
import api from '@/src/api/axios';


//Mock module api
vi.mock('@/src/api/axios',()=>({
    default:{
        post: vi.fn(),
        get: vi.fn(),
    },
}));


describe('FileScan Page Integration Test' ,() =>{
    beforeAll(() => {
        const mockCrypto = {
            subtle: {
                digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
            },
        };
        // ต้องมี configurable: true เพื่อบังคับเขียนทับ
        Object.defineProperty(window, 'crypto', { value: mockCrypto, configurable: true });
        Object.defineProperty(globalThis, 'crypto', { value: mockCrypto, configurable: true });
    });
    beforeEach(()=>{
        vi.clearAllMocks();
    });

    it('1. show screen (Idle State) correct' ,()=>{
        render(<FileScan/>);
        expect(screen.getByText(/Analyse suspicious files/i)).toBeInTheDocument();
        expect(screen.getByText(/Choose file/i)).toBeInTheDocument();
    });

    it('2. should process success and show result (cach file scenario)',async ()=>{
        (api.post as any).mockResolvedValueOnce({
            data:{
                cached:true,
                file_hash:'dummy-hash-123',
                analysis_result:{
                    data:{
                        attributes:{
                            stats:{harmless: 10, malicious: 0, suspicious: 0, undetected: 60},
                        },
                    },
                },
            },
        });
        render(<FileScan/>);

        //Action: upload mock file
        const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
        file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(32));
        const input = screen.getByLabelText(/Choose file/i);
        fireEvent.change(input , { target: { files: [file] } });

        
        
        await waitFor(()=>{
            expect(screen.getByText(/test.txt/i)).toBeInTheDocument();
        });

        expect(api.post).toHaveBeenCalledTimes(1);
    });//it2

    it('3. Should display an error massage when api connection fails' , async()=>{
        (api.post as any).mockRejectedValueOnce({
            response:{data : {error:'Server Down. Please try again later.'}},
        });
        render(<FileScan />);

        const file = new File(['dummy content'],'virus.exe',{type:'application/x-msdownload'});
        file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(32));
        const input = screen.getByLabelText(/Choose file/i);
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(()=>{
            expect(screen.getByText(/Server Down/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Try Again/i }))
        });
    });//it3
});
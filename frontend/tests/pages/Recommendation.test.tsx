import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import Recommendation from '@/src/pages/Recommendation';
import api from '@/src/api/axios';


vi.mock('@/src/api/axios', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

describe('Recommendation Page Test', () => {
    // 2. Mock Crypto และ File Buffer
    beforeAll(() => {
        File.prototype.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(32));
        const mockCrypto = {
            subtle: { digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)) },
        };
        Object.defineProperty(window, 'crypto', { value: mockCrypto, configurable: true });
        Object.defineProperty(globalThis, 'crypto', { value: mockCrypto, configurable: true });
    });

    beforeEach(() => {
        // ⚠️ สำคัญมาก: เปลี่ยนมาใช้ resetAllMocks เพื่อล้างพฤติกรรม Mock ของข้อเก่าทิ้งให้หมด
        vi.resetAllMocks();
    });

    it('1. Should render the initial Idle screen correctly', () => {
        render(<Recommendation />);
        expect(screen.getByText(/AI Security Recommendation/i)).toBeInTheDocument();
    });

    it('2. Should process successfully and show AI recommendation (Cached scenario)', async () => {
        // ใช้ท่า Chain Mock: ครั้งแรกคือ Upload-to-VT, ครั้งที่สองคือ Recommendation
        (api.post as any)
            .mockResolvedValueOnce({
                data: {
                    cached: true,
                    file_hash: 'dummy-hash-123',
                    analysis_result: { data: 'mock-report-data' },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    recommendation: '### AI Advice\nMalware detected. Delete it immediately.',
                },
            });

        render(<Recommendation />);

        // จำลองการอัปโหลดไฟล์
        const file = new File(['dummy content'], 'virus.exe', { type: 'application/x-msdownload' });
        const input = screen.getByLabelText(/Choose file/i);
        fireEvent.change(input, { target: { files: [file] } });

        // รอจนกว่าจะแสดงหน้าจอเสร็จสมบูรณ์
        await waitFor(() => {
            expect(screen.getByText('AI Security Analysis')).toBeInTheDocument();
            expect(screen.getByText('virus.exe')).toBeInTheDocument();
            expect(screen.getByText(/Malware detected/i)).toBeInTheDocument();
        });
    });

    it('3. Should display an error message when API fails', async () => {
        // จำลองเซิร์ฟเวอร์พัง
        (api.post as any).mockRejectedValueOnce({
            response: { data: { error: 'Server Down. Please try again.' } },
        });

        render(<Recommendation />);

        const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
        const input = screen.getByLabelText(/Choose file/i);
        fireEvent.change(input, { target: { files: [file] } });

        // ตรวจสอบว่าโชว์ข้อความ Error บนหน้าจอ
        await waitFor(() => {
            expect(screen.getByText(/Server Down/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
        });
    });

    it('4. Should reset to idle state when "Try again" or "Scan another" is clicked', async () => {
        // จำลองให้พังเพื่อจะโชว์ปุ่ม Try again
        (api.post as any).mockRejectedValueOnce({
            response: { data: { error: 'Upload Failed' } },
        });

        render(<Recommendation />);

        const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
        const input = screen.getByLabelText(/Choose file/i);
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/Upload Failed/i)).toBeInTheDocument();
        });

        // กดปุ่ม Try again
        const tryAgainButton = screen.getByRole('button', { name: /Try again/i });
        fireEvent.click(tryAgainButton);

        // หน้าจอต้องกลับมาหน้าแรก
        expect(screen.getByText(/AI Security Recommendation/i)).toBeInTheDocument();
    });
});
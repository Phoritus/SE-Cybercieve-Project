import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach} from 'vitest';
import  Profile from '@/src/pages/Profile';
import api from '@/src/api/axios';

// Mock the API module
vi.mock('@/src/api/axios', () => ({
default: {
    get: vi.fn(),
    put: vi.fn(),
},
}));
// Mock useNavigate to capture navigation calls
const mockNevigate = vi.fn();
vi.mock('react-router-dom',async ()=>{
    const actual = await vi.importActual('react-router-dom');
    return{
        ...actual,
        useNavigate: () =>mockNevigate,
    };
});

describe('Profile Page' , ()=>{
    beforeEach(()=>{
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    // Test case 1: Verify that the profile page displays the user's profile information correctly when the API call is successful
    it('1. Should display Loading first, then show fetched profile data' ,async()=>{
        (api.get as any).mockResolvedValueOnce({
            data:{  email:'john@test.com',username:'test123',first_name:'John',last_name:'Doe'}
        });
        render(<Profile/>)
        // Initially, "Loading" text should be present
        expect(screen.getByAltText(/Loading/i)).toBeInTheDocument();
        // Wait for the profile data to be displayed after successful API call
        await waitFor(() => {
            expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument()
            expect(screen.getByDisplayValue('test123')).toBeInTheDocument()
            expect(screen.getByDisplayValue('John')).toBeInTheDocument()
            expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
        });
    });
    // Test case 2: Simulate an API failure when fetching profile data and verify that an error message is displayed
    it('2. Should display an error message when profile data fails to load',async()=>{
        (api.get as any).mockRejectedValueOnce(new Error('Network Error'));
        render(<Profile/>)
        await waitFor(()=>{
            expect(screen.getByText(/Failed to load profile/i)).toBeInTheDocument()
        });
    });
    // Test case 3: Simulate editing profile data and saving changes, then verify that the API is called with the updated data and a success message is displayed
    it('3. Should edit data and save successfully (Update Profile)',async()=>{
        (api.get as any).mockResolvedValueOnce({
            data:{  email:'john@test.com',username:'test123',first_name:'John',last_name:'Doe'}
        });
        // Mock successful API response for Save (PUT) action
        (api.put as any).mockResolvedValueOnce({data:{}});
        render(<Profile/>)
        await waitFor(() => {
            expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        });
        const firstNameInput = screen.getByPlaceholderText(/First Name/i);
        fireEvent.change(firstNameInput,{target:{name:'first_name' ,value:'Jane'}});
        const saveButton = screen.getByRole('button',{name:/Save Change/i});
        fireEvent.click(saveButton);
        // Assert: System should send new data to API and show a success message
        await waitFor(()=>{
            expect(api.put).toHaveBeenCalledWith('/me',{
                username : 'test123',
                first_name:'Jane',
                last_name:'Doe'
            });
            expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
        });
    });
    // Test case 4: Simulate clicking the Cancel button and verify that it navigates back to the scan page
    it('4. Should navigate back to scan when Cancel button is clicked' , async ()=>{
        (api.get as any).mockResolvedValueOnce({
            data:{  email:'john@test.com',username:'test123',first_name:'John',last_name:'Doe'}
        });
        render(<Profile />);
        await waitFor(()=>{
        expect(screen.getByDisplayValue('John')).toBeInTheDocument(); 
        });
        const cancelButton = screen.getByRole('button',{name:/Cancel/i});
        fireEvent.click(cancelButton);
        // Assert: Should navigate back to the scan page
        expect(mockNevigate).toHaveBeenCalledWith('/scan');
    });
});//describe